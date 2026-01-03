// Example usage of the Jira integration module
// This file demonstrates how to use the Jira client in the Vibe Kanban project

use services::jira::{
    CreateJiraIssueRequest, JiraClient, JiraError, UpdateJiraIssueRequest,
};

#[tokio::main]
async fn main() -> Result<(), JiraError> {
    // Initialize the Jira client with credentials
    // In production, these should come from environment variables or secure storage
    let base_url = std::env::var("JIRA_BASE_URL")
        .unwrap_or_else(|_| "https://your-domain.atlassian.net".to_string());
    let email = std::env::var("JIRA_EMAIL")
        .unwrap_or_else(|_| "user@example.com".to_string());
    let api_token = std::env::var("JIRA_API_TOKEN")
        .unwrap_or_else(|_| "your-api-token".to_string());

    let client = JiraClient::new(base_url, email, api_token)?;

    // Test the connection
    println!("Testing Jira connection...");
    client.test_connection().await?;
    println!("✓ Successfully connected to Jira");

    // List all accessible projects
    println!("\nFetching projects...");
    let projects = client.get_projects().await?;
    println!("Found {} projects:", projects.len());
    for project in &projects {
        println!("  - {} ({}): {}", project.name, project.key, 
                 project.description.as_deref().unwrap_or("No description"));
    }

    // Get a specific project
    if let Some(first_project) = projects.first() {
        println!("\nFetching project details for {}...", first_project.key);
        let project = client.get_project(&first_project.key).await?;
        println!("Project: {} ({})", project.name, project.key);
        if let Some(lead) = project.lead {
            println!("Lead: {}", lead.display_name);
        }

        // Get issues for the project
        println!("\nFetching issues for {}...", project.key);
        let issues = client.get_issues(&project.key, Some(10)).await?;
        println!("Found {} issues:", issues.len());
        for issue in &issues {
            println!("  - {}: {} [{}]", issue.key, issue.summary, issue.status);
        }

        // Create a new issue (commented out to avoid creating test issues)
        /*
        println!("\nCreating a new issue...");
        let create_request = CreateJiraIssueRequest {
            project_key: project.key.clone(),
            summary: "Test issue created via API".to_string(),
            description: Some("This is a test issue created through the Jira integration module.".to_string()),
            issue_type: "Task".to_string(),
            priority: Some("Medium".to_string()),
            assignee_id: None,
        };
        let new_issue = client.create_issue(&create_request).await?;
        println!("✓ Created issue: {} - {}", new_issue.key, new_issue.summary);

        // Update the issue
        println!("\nUpdating issue {}...", new_issue.key);
        let update_request = UpdateJiraIssueRequest {
            summary: Some("Updated test issue".to_string()),
            description: Some("This description was updated.".to_string()),
            assignee_id: None,
            priority: Some("High".to_string()),
        };
        client.update_issue(&new_issue.key, &update_request).await?;
        println!("✓ Updated issue: {}", new_issue.key);

        // Get available transitions
        println!("\nFetching transitions for {}...", new_issue.key);
        let transitions = client.get_transitions(&new_issue.key).await?;
        println!("Available transitions:");
        for transition in &transitions {
            println!("  - {} -> {}", transition.name, transition.to.name);
        }

        // Add a comment
        println!("\nAdding comment to {}...", new_issue.key);
        client.add_comment(&new_issue.key, "This is a test comment.").await?;
        println!("✓ Added comment to issue");
        */

        // Search using JQL
        println!("\nSearching issues with JQL...");
        let jql = format!("project = {} AND status = 'To Do' ORDER BY created DESC", project.key);
        let search_results = client.search_issues(&jql, Some(5)).await?;
        println!("Found {} issues matching search:", search_results.len());
        for issue in &search_results {
            println!("  - {}: {}", issue.key, issue.summary);
        }
    }

    println!("\n✓ All operations completed successfully");
    Ok(())
}
