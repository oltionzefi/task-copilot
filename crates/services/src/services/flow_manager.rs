use serde::{Deserialize, Serialize};
use std::fmt;
use thiserror::Error;
use ts_rs::TS;

#[derive(Debug, Error)]
pub enum FlowError {
    #[error("Invalid intent: {0}")]
    InvalidIntent(String),
    #[error("Flow execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum FlowIntent {
    Code,
    Jira,
    Confluence,
}

impl fmt::Display for FlowIntent {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FlowIntent::Code => write!(f, "code"),
            FlowIntent::Jira => write!(f, "jira"),
            FlowIntent::Confluence => write!(f, "confluence"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FlowAction {
    pub name: String,
    pub description: String,
    pub status: FlowActionStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum FlowActionStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FlowSummary {
    pub intent: FlowIntent,
    pub description: String,
    pub actions: Vec<FlowAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeFlowInput {
    pub title: String,
    pub description: String,
    pub repository_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraFlowInput {
    pub title: String,
    pub description: String,
    pub project_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfluenceFlowInput {
    pub title: String,
    pub description: String,
    pub space_key: Option<String>,
}

#[derive(Debug, Clone)]
pub struct FlowManager {
    intent: FlowIntent,
}

impl FlowManager {
    pub fn new(intent: FlowIntent) -> Self {
        Self { intent }
    }

    pub fn intent(&self) -> FlowIntent {
        self.intent
    }

    pub fn create_code_flow(&self, input: &CodeFlowInput) -> Result<FlowSummary, FlowError> {
        if self.intent != FlowIntent::Code {
            return Err(FlowError::InvalidIntent(format!(
                "Expected Code intent, got {}",
                self.intent
            )));
        }

        let actions = vec![
            FlowAction {
                name: "Check Existing Code".to_string(),
                description: "Analyze current codebase and identify relevant files".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Create Issue".to_string(),
                description: "Create task tracking issue for changes".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Implement Solution".to_string(),
                description: "Generate code changes based on requirements".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Fix Issues".to_string(),
                description: "Address any errors or test failures".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Override Files".to_string(),
                description: "Apply changes to repository files".to_string(),
                status: FlowActionStatus::Pending,
            },
        ];

        Ok(FlowSummary {
            intent: FlowIntent::Code,
            description: format!("Code flow: {}", input.title),
            actions,
        })
    }

    pub fn create_jira_flow(&self, input: &JiraFlowInput) -> Result<FlowSummary, FlowError> {
        if self.intent != FlowIntent::Jira {
            return Err(FlowError::InvalidIntent(format!(
                "Expected Jira intent, got {}",
                self.intent
            )));
        }

        let actions = vec![
            FlowAction {
                name: "Read Title & Description".to_string(),
                description: "Parse and understand Jira requirements".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Analyze Requirements".to_string(),
                description: "Use agents to analyze best approach for solution".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Generate Task Proposal".to_string(),
                description: "Create detailed task breakdown and implementation plan".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Review Jira".to_string(),
                description: "Present proposal for review (no code modifications)".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Finalize".to_string(),
                description: "Confirm and save Jira task proposal".to_string(),
                status: FlowActionStatus::Pending,
            },
        ];

        Ok(FlowSummary {
            intent: FlowIntent::Jira,
            description: format!("Jira flow: {}", input.title),
            actions,
        })
    }

    pub fn create_confluence_flow(
        &self,
        input: &ConfluenceFlowInput,
    ) -> Result<FlowSummary, FlowError> {
        if self.intent != FlowIntent::Confluence {
            return Err(FlowError::InvalidIntent(format!(
                "Expected Confluence intent, got {}",
                self.intent
            )));
        }

        let actions = vec![
            FlowAction {
                name: "Read Title & Description".to_string(),
                description: "Parse and understand documentation requirements".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Analyze Documentation Needs".to_string(),
                description: "Use agents to determine best documentation structure".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Generate Documentation".to_string(),
                description: "Create comprehensive Confluence page content".to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Review Confluence".to_string(),
                description: "Present documentation for review (no code modifications)"
                    .to_string(),
                status: FlowActionStatus::Pending,
            },
            FlowAction {
                name: "Finalize".to_string(),
                description: "Confirm and save Confluence documentation".to_string(),
                status: FlowActionStatus::Pending,
            },
        ];

        Ok(FlowSummary {
            intent: FlowIntent::Confluence,
            description: format!("Confluence flow: {}", input.title),
            actions,
        })
    }

    pub fn execute_flow(
        &self,
        summary: &mut FlowSummary,
    ) -> Result<Vec<FlowAction>, FlowError> {
        match self.intent {
            FlowIntent::Code => self.execute_code_flow(summary),
            FlowIntent::Jira => self.execute_jira_flow(summary),
            FlowIntent::Confluence => self.execute_confluence_flow(summary),
        }
    }

    fn execute_code_flow(&self, summary: &mut FlowSummary) -> Result<Vec<FlowAction>, FlowError> {
        for action in summary.actions.iter_mut() {
            action.status = FlowActionStatus::InProgress;
            
            match action.name.as_str() {
                "Check Existing Code" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Create Issue" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Implement Solution" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Fix Issues" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Override Files" => {
                    action.status = FlowActionStatus::Completed;
                }
                _ => {
                    action.status = FlowActionStatus::Failed;
                }
            }
        }

        Ok(summary.actions.clone())
    }

    fn execute_jira_flow(&self, summary: &mut FlowSummary) -> Result<Vec<FlowAction>, FlowError> {
        for action in summary.actions.iter_mut() {
            action.status = FlowActionStatus::InProgress;
            
            match action.name.as_str() {
                "Read Title & Description" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Analyze Requirements" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Generate Task Proposal" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Review Jira" => {
                    action.status = FlowActionStatus::Pending;
                }
                "Finalize" => {
                    action.status = FlowActionStatus::Pending;
                }
                _ => {
                    action.status = FlowActionStatus::Failed;
                }
            }
        }

        Ok(summary.actions.clone())
    }

    fn execute_confluence_flow(
        &self,
        summary: &mut FlowSummary,
    ) -> Result<Vec<FlowAction>, FlowError> {
        for action in summary.actions.iter_mut() {
            action.status = FlowActionStatus::InProgress;
            
            match action.name.as_str() {
                "Read Title & Description" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Analyze Documentation Needs" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Generate Documentation" => {
                    action.status = FlowActionStatus::Completed;
                }
                "Review Confluence" => {
                    action.status = FlowActionStatus::Pending;
                }
                "Finalize" => {
                    action.status = FlowActionStatus::Pending;
                }
                _ => {
                    action.status = FlowActionStatus::Failed;
                }
            }
        }

        Ok(summary.actions.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_flow_creation() {
        let manager = FlowManager::new(FlowIntent::Code);
        let input = CodeFlowInput {
            title: "Add login feature".to_string(),
            description: "Implement user authentication".to_string(),
            repository_path: Some("/path/to/repo".to_string()),
        };

        let summary = manager.create_code_flow(&input).unwrap();
        assert_eq!(summary.intent, FlowIntent::Code);
        assert_eq!(summary.actions.len(), 5);
        assert_eq!(summary.actions[0].name, "Check Existing Code");
        assert_eq!(summary.actions[4].name, "Override Files");
    }

    #[test]
    fn test_jira_flow_creation() {
        let manager = FlowManager::new(FlowIntent::Jira);
        let input = JiraFlowInput {
            title: "PROJ-123: Database migration".to_string(),
            description: "Migrate from MySQL to PostgreSQL".to_string(),
            project_key: Some("PROJ".to_string()),
        };

        let summary = manager.create_jira_flow(&input).unwrap();
        assert_eq!(summary.intent, FlowIntent::Jira);
        assert_eq!(summary.actions.len(), 5);
        assert_eq!(summary.actions[3].name, "Review Jira");
        assert_eq!(summary.actions[4].name, "Finalize");
    }

    #[test]
    fn test_confluence_flow_creation() {
        let manager = FlowManager::new(FlowIntent::Confluence);
        let input = ConfluenceFlowInput {
            title: "API Documentation".to_string(),
            description: "Document REST API endpoints".to_string(),
            space_key: Some("DEV".to_string()),
        };

        let summary = manager.create_confluence_flow(&input).unwrap();
        assert_eq!(summary.intent, FlowIntent::Confluence);
        assert_eq!(summary.actions.len(), 5);
        assert_eq!(summary.actions[3].name, "Review Confluence");
        assert_eq!(summary.actions[4].name, "Finalize");
    }

    #[test]
    fn test_invalid_intent_for_code() {
        let manager = FlowManager::new(FlowIntent::Jira);
        let input = CodeFlowInput {
            title: "Test".to_string(),
            description: "Test".to_string(),
            repository_path: None,
        };

        let result = manager.create_code_flow(&input);
        assert!(result.is_err());
    }

    #[test]
    fn test_flow_execution() {
        let manager = FlowManager::new(FlowIntent::Code);
        let input = CodeFlowInput {
            title: "Test".to_string(),
            description: "Test".to_string(),
            repository_path: None,
        };

        let mut summary = manager.create_code_flow(&input).unwrap();
        let actions = manager.execute_flow(&mut summary).unwrap();
        
        assert_eq!(actions.len(), 5);
        assert!(actions.iter().all(|a| a.status == FlowActionStatus::Completed));
    }
}
