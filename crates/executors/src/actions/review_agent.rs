use std::{path::Path, sync::Arc};

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    actions::Executable,
    approvals::ExecutorApprovalService,
    env::ExecutionEnv,
    executors::{BaseCodingAgent, ExecutorError, SpawnedChild, StandardCodingAgentExecutor},
    profile::{ExecutorConfigs, ExecutorProfileId},
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub struct ReviewAgentRequest {
    pub prompt: String,
    /// Executor profile specification
    #[serde(alias = "profile_variant_label")]
    pub executor_profile_id: ExecutorProfileId,
    /// Optional relative path to execute the agent in (relative to container_ref).
    /// If None, uses the container_ref directory directly.
    #[serde(default)]
    pub working_dir: Option<String>,
}

impl ReviewAgentRequest {
    pub fn base_executor(&self) -> BaseCodingAgent {
        self.executor_profile_id.executor
    }

    /// Create a new review agent request with specialized review instructions
    pub fn new(
        executor_profile_id: ExecutorProfileId,
        task_description: String,
        working_dir: Option<String>,
    ) -> Self {
        let prompt = Self::build_review_prompt(task_description);
        Self {
            prompt,
            executor_profile_id,
            working_dir,
        }
    }

    /// Build the specialized review prompt
    fn build_review_prompt(task_description: String) -> String {
        format!(
            r#"# Code Review Task

You are a specialized code review agent. Your task is to review the code changes that were made for the following task:

{}

## Your Review Process

1. **Examine the Changes**: Use git commands to review:
   - `git --no-pager diff HEAD` - See all uncommitted changes
   - `git --no-pager log --oneline -10` - Check recent commits
   - `git --no-pager diff <commit>^..<commit>` - Review specific commits

2. **Code Quality Assessment**:
   - Check if the implementation matches the task requirements
   - Look for potential bugs, edge cases, or logic errors
   - Verify code follows best practices and conventions
   - Check for proper error handling
   - Assess test coverage (if applicable)

3. **Security & Performance**:
   - Identify any security vulnerabilities
   - Check for performance issues or inefficiencies
   - Look for proper input validation

4. **Provide Structured Feedback**:
   - Start with a Review Feedback header
   - List specific issues found (if any)
   - Suggest improvements
   - Highlight what was done well
   - Give an overall assessment

## Important Guidelines

- You are in READ-ONLY review mode - DO NOT modify any code
- Focus on providing constructive, actionable feedback
- Be specific: reference file names, line numbers, and code snippets
- Prioritize critical issues over minor style preferences
- If everything looks good, say so clearly

Begin your review now."#,
            task_description
        )
    }
}

#[async_trait]
impl Executable for ReviewAgentRequest {
    async fn spawn(
        &self,
        current_dir: &Path,
        approvals: Arc<dyn ExecutorApprovalService>,
        env: &ExecutionEnv,
    ) -> Result<SpawnedChild, ExecutorError> {
        let effective_dir = match &self.working_dir {
            Some(rel_path) => current_dir.join(rel_path),
            None => current_dir.to_path_buf(),
        };

        let executor_profile_id = self.executor_profile_id.clone();
        let mut agent = ExecutorConfigs::get_cached()
            .get_coding_agent(&executor_profile_id)
            .ok_or(ExecutorError::UnknownExecutorType(
                executor_profile_id.to_string(),
            ))?;

        agent.use_approvals(approvals.clone());

        agent.spawn(&effective_dir, &self.prompt, env).await
    }
}
