use base64::{Engine as _, engine::general_purpose};
use reqwest::{header, Client, StatusCode};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use ts_rs::TS;

/// Jira API client for interacting with Jira projects using API tokens
#[derive(Debug, Clone)]
pub struct JiraClient {
    base_url: String,
    email: String,
    api_token: String,
    client: Client,
}

#[derive(Debug, Error)]
pub enum JiraError {
    #[error("Authentication failed: {0}")]
    AuthFailed(String),
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    #[error("API request failed: {0}")]
    RequestFailed(String),
    #[error("Resource not found: {0}")]
    NotFound(String),
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),
    #[error("JSON parsing error: {0}")]
    JsonError(#[from] serde_json::Error),
}

/// Jira issue representation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct JiraIssue {
    pub id: String,
    pub key: String,
    pub summary: String,
    pub description: Option<String>,
    pub status: String,
    pub issue_type: String,
    pub assignee: Option<JiraUser>,
    pub reporter: Option<JiraUser>,
    pub created: String,
    pub updated: String,
    pub priority: Option<String>,
}

/// Jira user representation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct JiraUser {
    pub account_id: String,
    pub email: Option<String>,
    pub display_name: String,
}

/// Jira project representation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct JiraProject {
    pub id: String,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub lead: Option<JiraUser>,
}

/// Request to create a Jira issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJiraIssueRequest {
    pub project_key: String,
    pub summary: String,
    pub description: Option<String>,
    pub issue_type: String,
    pub priority: Option<String>,
    pub assignee_id: Option<String>,
}

/// Request to update a Jira issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateJiraIssueRequest {
    pub summary: Option<String>,
    pub description: Option<String>,
    pub assignee_id: Option<String>,
    pub priority: Option<String>,
}

/// Request to transition a Jira issue (change status)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionJiraIssueRequest {
    pub transition_id: String,
}

/// Jira transition representation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct JiraTransition {
    pub id: String,
    pub name: String,
    pub to: JiraStatus,
}

/// Jira status representation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct JiraStatus {
    pub id: String,
    pub name: String,
}

impl JiraClient {
    /// Create a new Jira client with API token authentication
    pub fn new(base_url: String, email: String, api_token: String) -> Result<Self, JiraError> {
        if base_url.is_empty() {
            return Err(JiraError::InvalidConfig(
                "Base URL cannot be empty".to_string(),
            ));
        }
        if email.is_empty() {
            return Err(JiraError::InvalidConfig("Email cannot be empty".to_string()));
        }
        if api_token.is_empty() {
            return Err(JiraError::InvalidConfig(
                "API token cannot be empty".to_string(),
            ));
        }

        let base_url = base_url.trim_end_matches('/').to_string();

        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| JiraError::InvalidConfig(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            base_url,
            email,
            api_token,
            client,
        })
    }

    fn get_auth_header(&self) -> String {
        let credentials = format!("{}:{}", self.email, self.api_token);
        format!("Basic {}", general_purpose::STANDARD.encode(credentials))
    }

    /// Test the connection and authentication
    pub async fn test_connection(&self) -> Result<(), JiraError> {
        let url = format!("{}/rest/api/3/myself", self.base_url);

        let response = self
            .client
            .get(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .send()
            .await?;

        match response.status() {
            StatusCode::OK => Ok(()),
            StatusCode::UNAUTHORIZED => Err(JiraError::AuthFailed(
                "Invalid credentials or API token".to_string(),
            )),
            StatusCode::FORBIDDEN => Err(JiraError::PermissionDenied(
                "Access forbidden with current credentials".to_string(),
            )),
            status => Err(JiraError::RequestFailed(format!(
                "Connection test failed with status: {}",
                status
            ))),
        }
    }

    /// Get a list of projects accessible to the user
    pub async fn get_projects(&self) -> Result<Vec<JiraProject>, JiraError> {
        let url = format!("{}/rest/api/3/project", self.base_url);

        let response = self
            .client
            .get(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let projects_json: Vec<serde_json::Value> = response.json().await?;
        let projects = projects_json
            .into_iter()
            .map(|p| {
                let lead = p["lead"].as_object().map(|l| JiraUser {
                    account_id: l["accountId"].as_str().unwrap_or("").to_string(),
                    email: l["emailAddress"].as_str().map(|s| s.to_string()),
                    display_name: l["displayName"].as_str().unwrap_or("").to_string(),
                });

                JiraProject {
                    id: p["id"].as_str().unwrap_or("").to_string(),
                    key: p["key"].as_str().unwrap_or("").to_string(),
                    name: p["name"].as_str().unwrap_or("").to_string(),
                    description: p["description"].as_str().map(|s| s.to_string()),
                    lead,
                }
            })
            .collect();

        Ok(projects)
    }

    /// Get a specific project by key
    pub async fn get_project(&self, project_key: &str) -> Result<JiraProject, JiraError> {
        let url = format!("{}/rest/api/3/project/{}", self.base_url, project_key);

        let response = self
            .client
            .get(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let p: serde_json::Value = response.json().await?;
        let lead = p["lead"].as_object().map(|l| JiraUser {
            account_id: l["accountId"].as_str().unwrap_or("").to_string(),
            email: l["emailAddress"].as_str().map(|s| s.to_string()),
            display_name: l["displayName"].as_str().unwrap_or("").to_string(),
        });

        Ok(JiraProject {
            id: p["id"].as_str().unwrap_or("").to_string(),
            key: p["key"].as_str().unwrap_or("").to_string(),
            name: p["name"].as_str().unwrap_or("").to_string(),
            description: p["description"].as_str().map(|s| s.to_string()),
            lead,
        })
    }

    /// Get issues for a project using JQL
    pub async fn get_issues(
        &self,
        project_key: &str,
        max_results: Option<u32>,
    ) -> Result<Vec<JiraIssue>, JiraError> {
        let jql = format!("project = {}", project_key);
        self.search_issues(&jql, max_results).await
    }

    /// Search issues using JQL (Jira Query Language)
    pub async fn search_issues(
        &self,
        jql: &str,
        max_results: Option<u32>,
    ) -> Result<Vec<JiraIssue>, JiraError> {
        let url = format!("{}/rest/api/3/search", self.base_url);
        let max_results = max_results.unwrap_or(50);

        let body = serde_json::json!({
            "jql": jql,
            "maxResults": max_results,
            "fields": ["summary", "description", "status", "issuetype", "assignee", "reporter", "created", "updated", "priority"]
        });

        let response = self
            .client
            .post(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&body)
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let result: serde_json::Value = response.json().await?;
        let issues_json = result["issues"]
            .as_array()
            .ok_or_else(|| JiraError::RequestFailed("Expected issues array in response".to_string()))?;

        let issues = issues_json
            .iter()
            .filter_map(|i| self.parse_issue(i))
            .collect();

        Ok(issues)
    }

    /// Get a specific issue by key
    pub async fn get_issue(&self, issue_key: &str) -> Result<JiraIssue, JiraError> {
        let url = format!("{}/rest/api/3/issue/{}", self.base_url, issue_key);

        let response = self
            .client
            .get(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let issue_json: serde_json::Value = response.json().await?;
        self.parse_issue(&issue_json)
            .ok_or_else(|| JiraError::RequestFailed("Failed to parse issue response".to_string()))
    }

    /// Create a new issue
    pub async fn create_issue(
        &self,
        request: &CreateJiraIssueRequest,
    ) -> Result<JiraIssue, JiraError> {
        let url = format!("{}/rest/api/3/issue", self.base_url);

        let mut fields = serde_json::json!({
            "project": {
                "key": request.project_key
            },
            "summary": request.summary,
            "issuetype": {
                "name": request.issue_type
            }
        });

        if let Some(description) = &request.description {
            fields["description"] = serde_json::json!({
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": description
                    }]
                }]
            });
        }

        if let Some(priority) = &request.priority {
            fields["priority"] = serde_json::json!({"name": priority});
        }

        if let Some(assignee_id) = &request.assignee_id {
            fields["assignee"] = serde_json::json!({"id": assignee_id});
        }

        let body = serde_json::json!({ "fields": fields });

        let response = self
            .client
            .post(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&body)
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let result: serde_json::Value = response.json().await?;
        let issue_key = result["key"]
            .as_str()
            .ok_or_else(|| JiraError::RequestFailed("Missing issue key in response".to_string()))?;

        self.get_issue(issue_key).await
    }

    /// Update an existing issue
    pub async fn update_issue(
        &self,
        issue_key: &str,
        request: &UpdateJiraIssueRequest,
    ) -> Result<(), JiraError> {
        let url = format!("{}/rest/api/3/issue/{}", self.base_url, issue_key);

        let mut fields = serde_json::Map::new();

        if let Some(summary) = &request.summary {
            fields.insert("summary".to_string(), serde_json::json!(summary));
        }

        if let Some(description) = &request.description {
            fields.insert(
                "description".to_string(),
                serde_json::json!({
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": description
                        }]
                    }]
                }),
            );
        }

        if let Some(assignee_id) = &request.assignee_id {
            fields.insert(
                "assignee".to_string(),
                serde_json::json!({"id": assignee_id}),
            );
        }

        if let Some(priority) = &request.priority {
            fields.insert("priority".to_string(), serde_json::json!({"name": priority}));
        }

        let body = serde_json::json!({ "fields": fields });

        let response = self
            .client
            .put(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&body)
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        Ok(())
    }

    /// Get available transitions for an issue
    pub async fn get_transitions(
        &self,
        issue_key: &str,
    ) -> Result<Vec<JiraTransition>, JiraError> {
        let url = format!(
            "{}/rest/api/3/issue/{}/transitions",
            self.base_url, issue_key
        );

        let response = self
            .client
            .get(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        let result: serde_json::Value = response.json().await?;
        let transitions_json = result["transitions"].as_array().ok_or_else(|| {
            JiraError::RequestFailed("Expected transitions array in response".to_string())
        })?;

        let transitions = transitions_json
            .iter()
            .filter_map(|t| {
                let id = t["id"].as_str()?.to_string();
                let name = t["name"].as_str()?.to_string();
                let to = t["to"].as_object()?;
                let status = JiraStatus {
                    id: to["id"].as_str()?.to_string(),
                    name: to["name"].as_str()?.to_string(),
                };

                Some(JiraTransition {
                    id,
                    name,
                    to: status,
                })
            })
            .collect();

        Ok(transitions)
    }

    /// Transition an issue to a new status
    pub async fn transition_issue(
        &self,
        issue_key: &str,
        transition_id: &str,
    ) -> Result<(), JiraError> {
        let url = format!(
            "{}/rest/api/3/issue/{}/transitions",
            self.base_url, issue_key
        );

        let body = serde_json::json!({
            "transition": {
                "id": transition_id
            }
        });

        let response = self
            .client
            .post(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&body)
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        Ok(())
    }

    /// Add a comment to an issue
    pub async fn add_comment(&self, issue_key: &str, comment: &str) -> Result<(), JiraError> {
        let url = format!("{}/rest/api/3/issue/{}/comment", self.base_url, issue_key);

        let body = serde_json::json!({
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": comment
                    }]
                }]
            }
        });

        let response = self
            .client
            .post(&url)
            .header(header::AUTHORIZATION, self.get_auth_header())
            .header(header::ACCEPT, "application/json")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&body)
            .send()
            .await?;

        self.handle_response_status(response.status())?;

        Ok(())
    }

    fn handle_response_status(&self, status: StatusCode) -> Result<(), JiraError> {
        match status {
            StatusCode::OK | StatusCode::CREATED | StatusCode::NO_CONTENT => Ok(()),
            StatusCode::UNAUTHORIZED => Err(JiraError::AuthFailed(
                "Invalid credentials or API token".to_string(),
            )),
            StatusCode::FORBIDDEN => Err(JiraError::PermissionDenied(
                "Insufficient permissions for this operation".to_string(),
            )),
            StatusCode::NOT_FOUND => {
                Err(JiraError::NotFound("Resource not found".to_string()))
            }
            status => Err(JiraError::RequestFailed(format!(
                "Request failed with status: {}",
                status
            ))),
        }
    }

    fn parse_issue(&self, issue_json: &serde_json::Value) -> Option<JiraIssue> {
        let fields = issue_json["fields"].as_object()?;

        let assignee = fields["assignee"].as_object().map(|a| JiraUser {
            account_id: a["accountId"].as_str().unwrap_or("").to_string(),
            email: a["emailAddress"].as_str().map(|s| s.to_string()),
            display_name: a["displayName"].as_str().unwrap_or("").to_string(),
        });

        let reporter = fields["reporter"].as_object().map(|r| JiraUser {
            account_id: r["accountId"].as_str().unwrap_or("").to_string(),
            email: r["emailAddress"].as_str().map(|s| s.to_string()),
            display_name: r["displayName"].as_str().unwrap_or("").to_string(),
        });

        let description = fields["description"]
            .as_object()
            .and_then(|d| self.extract_text_from_adf(d));

        Some(JiraIssue {
            id: issue_json["id"].as_str()?.to_string(),
            key: issue_json["key"].as_str()?.to_string(),
            summary: fields["summary"].as_str()?.to_string(),
            description,
            status: fields["status"]["name"].as_str()?.to_string(),
            issue_type: fields["issuetype"]["name"].as_str()?.to_string(),
            assignee,
            reporter,
            created: fields["created"].as_str()?.to_string(),
            updated: fields["updated"].as_str()?.to_string(),
            priority: fields["priority"]["name"].as_str().map(|s| s.to_string()),
        })
    }

    fn extract_text_from_adf(&self, adf: &serde_json::Map<String, serde_json::Value>) -> Option<String> {
        let content = adf.get("content")?.as_array()?;
        let mut text = String::new();

        for node in content {
            if let Some(node_content) = node["content"].as_array() {
                for text_node in node_content {
                    if let Some(t) = text_node["text"].as_str() {
                        text.push_str(t);
                        text.push(' ');
                    }
                }
            }
        }

        if text.is_empty() {
            None
        } else {
            Some(text.trim().to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = JiraClient::new(
            "https://example.atlassian.net".to_string(),
            "user@example.com".to_string(),
            "test_token".to_string(),
        );
        assert!(client.is_ok());
    }

    #[test]
    fn test_client_validation() {
        let result = JiraClient::new("".to_string(), "user@example.com".to_string(), "token".to_string());
        assert!(result.is_err());

        let result = JiraClient::new("https://example.atlassian.net".to_string(), "".to_string(), "token".to_string());
        assert!(result.is_err());

        let result = JiraClient::new("https://example.atlassian.net".to_string(), "user@example.com".to_string(), "".to_string());
        assert!(result.is_err());
    }
}
