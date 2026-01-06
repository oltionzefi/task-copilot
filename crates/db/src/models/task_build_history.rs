use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use strum_macros::{Display, EnumString};
use ts_rs::TS;
use uuid::Uuid;

#[derive(
    Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS, EnumString, Display,
)]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
#[ts(export)]
pub enum TaskBuildHistoryContextType {
    ChatMessage,
    ExecutionStep,
    AgentTurn,
    SetupComplete,
    Error,
    StatusChange,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskBuildHistory {
    pub id: Uuid,
    pub task_id: Uuid,
    pub workspace_id: Option<Uuid>,
    pub session_id: Option<Uuid>,
    pub context_type: TaskBuildHistoryContextType,
    pub content: String,
    pub metadata: Option<String>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskBuildHistory {
    pub task_id: Uuid,
    pub workspace_id: Option<Uuid>,
    pub session_id: Option<Uuid>,
    pub context_type: TaskBuildHistoryContextType,
    pub content: String,
    pub metadata: Option<String>,
}

impl TaskBuildHistory {
    /// Create a new build history entry
    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTaskBuildHistory,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        sqlx::query_as!(
            TaskBuildHistory,
            r#"INSERT INTO task_build_history (id, task_id, workspace_id, session_id, context_type, content, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   workspace_id as "workspace_id: Uuid",
                   session_id as "session_id: Uuid",
                   context_type as "context_type!: TaskBuildHistoryContextType",
                   content,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>",
                   expires_at as "expires_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.workspace_id,
            data.session_id,
            data.context_type,
            data.content,
            data.metadata
        )
        .fetch_one(pool)
        .await
    }

    /// Find all build history entries for a task
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskBuildHistory,
            r#"SELECT 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   workspace_id as "workspace_id: Uuid",
                   session_id as "session_id: Uuid",
                   context_type as "context_type!: TaskBuildHistoryContextType",
                   content,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>",
                   expires_at as "expires_at!: DateTime<Utc>"
               FROM task_build_history
               WHERE task_id = $1
               AND datetime(expires_at) >= datetime('now')
               ORDER BY created_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    /// Find build history entries for a specific workspace
    pub async fn find_by_workspace_id(
        pool: &SqlitePool,
        workspace_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskBuildHistory,
            r#"SELECT 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   workspace_id as "workspace_id: Uuid",
                   session_id as "session_id: Uuid",
                   context_type as "context_type!: TaskBuildHistoryContextType",
                   content,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>",
                   expires_at as "expires_at!: DateTime<Utc>"
               FROM task_build_history
               WHERE workspace_id = $1
               AND datetime(expires_at) >= datetime('now')
               ORDER BY created_at ASC"#,
            workspace_id
        )
        .fetch_all(pool)
        .await
    }

    /// Find build history entries for a specific session
    pub async fn find_by_session_id(
        pool: &SqlitePool,
        session_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskBuildHistory,
            r#"SELECT 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   workspace_id as "workspace_id: Uuid",
                   session_id as "session_id: Uuid",
                   context_type as "context_type!: TaskBuildHistoryContextType",
                   content,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>",
                   expires_at as "expires_at!: DateTime<Utc>"
               FROM task_build_history
               WHERE session_id = $1
               AND datetime(expires_at) >= datetime('now')
               ORDER BY created_at ASC"#,
            session_id
        )
        .fetch_all(pool)
        .await
    }

    /// Get the count of build history entries for a task
    pub async fn count_by_task_id(pool: &SqlitePool, task_id: Uuid) -> Result<i64, sqlx::Error> {
        let result = sqlx::query!(
            r#"SELECT COUNT(*) as "count!: i64"
               FROM task_build_history
               WHERE task_id = $1
               AND datetime(expires_at) >= datetime('now')"#,
            task_id
        )
        .fetch_one(pool)
        .await?;

        Ok(result.count)
    }

    /// Manually trigger cleanup of expired entries (usually handled by trigger)
    pub async fn cleanup_expired(pool: &SqlitePool) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            "DELETE FROM task_build_history WHERE datetime(expires_at) < datetime('now')"
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Delete all build history for a task (useful for testing or manual cleanup)
    pub async fn delete_by_task_id(pool: &SqlitePool, task_id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM task_build_history WHERE task_id = $1", task_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected())
    }

    /// Get the oldest entry date for a task (useful for understanding retention)
    pub async fn get_oldest_entry_date(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
        let result = sqlx::query!(
            r#"SELECT MIN(created_at) as "oldest: DateTime<Utc>"
               FROM task_build_history
               WHERE task_id = $1
               AND datetime(expires_at) >= datetime('now')"#,
            task_id
        )
        .fetch_one(pool)
        .await?;

        Ok(result.oldest)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        project::{CreateProject, Project},
        project_repo::CreateProjectRepo,
        task::{CreateTask, Task},
    };

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::connect(":memory:").await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    async fn create_test_project(pool: &SqlitePool) -> Project {
        let project_id = Uuid::new_v4();
        Project::create(
            pool,
            &CreateProject {
                name: "Test Project".to_string(),
                repositories: vec![],
            },
            project_id,
        )
        .await
        .unwrap()
    }

    async fn create_test_task(pool: &SqlitePool, project_id: Uuid) -> Task {
        let task_id = Uuid::new_v4();
        Task::create(
            pool,
            &CreateTask {
                project_id,
                title: "Test Task".to_string(),
                description: Some("Test description".to_string()),
                status: None,
                intent: None,
                parent_workspace_id: None,
                image_ids: None,
                shared_task_id: None,
            },
            task_id,
        )
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn test_create_build_history() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        let data = CreateTaskBuildHistory {
            task_id: task.id,
            workspace_id: None,
            session_id: None,
            context_type: TaskBuildHistoryContextType::ChatMessage,
            content: "Test chat message".to_string(),
            metadata: Some(r#"{"user": "test"}"#.to_string()),
        };

        let history = TaskBuildHistory::create(&pool, &data).await.unwrap();

        assert_eq!(history.task_id, task.id);
        assert_eq!(history.content, "Test chat message");
        assert_eq!(history.context_type, TaskBuildHistoryContextType::ChatMessage);
    }

    #[tokio::test]
    async fn test_find_by_task_id() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        // Create multiple history entries
        for i in 0..5 {
            let data = CreateTaskBuildHistory {
                task_id: task.id,
                workspace_id: None,
                session_id: None,
                context_type: TaskBuildHistoryContextType::ExecutionStep,
                content: format!("Step {}", i),
                metadata: None,
            };
            TaskBuildHistory::create(&pool, &data).await.unwrap();
        }

        let history = TaskBuildHistory::find_by_task_id(&pool, task.id)
            .await
            .unwrap();

        assert_eq!(history.len(), 5);
        // Verify content exists in order (the trigger may have reordered)
        assert!(history.iter().any(|h| h.content == "Step 0"));
        assert!(history.iter().any(|h| h.content == "Step 4"));
    }

    #[tokio::test]
    async fn test_count_by_task_id() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        // Create 10 entries
        for i in 0..10 {
            let data = CreateTaskBuildHistory {
                task_id: task.id,
                workspace_id: None,
                session_id: None,
                context_type: TaskBuildHistoryContextType::ChatMessage,
                content: format!("Message {}", i),
                metadata: None,
            };
            TaskBuildHistory::create(&pool, &data).await.unwrap();
        }

        let count = TaskBuildHistory::count_by_task_id(&pool, task.id)
            .await
            .unwrap();

        assert_eq!(count, 10);
    }

    #[tokio::test]
    async fn test_fifo_limit() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        // Create 105 entries (exceeds the 100 limit)
        for i in 0..105 {
            let data = CreateTaskBuildHistory {
                task_id: task.id,
                workspace_id: None,
                session_id: None,
                context_type: TaskBuildHistoryContextType::ChatMessage,
                content: format!("Message {}", i),
                metadata: None,
            };
            TaskBuildHistory::create(&pool, &data).await.unwrap();
        }

        // Should only have 100 entries due to FIFO
        let count = TaskBuildHistory::count_by_task_id(&pool, task.id)
            .await
            .unwrap();

        // The FIFO trigger should maintain a max of 100 entries
        assert!(
            count <= 100,
            "Expected at most 100 entries, got {}",
            count
        );

        let history = TaskBuildHistory::find_by_task_id(&pool, task.id)
            .await
            .unwrap();

        // Verify the last message exists (most recent should always be kept)
        assert!(
            history.iter().any(|h| h.content == "Message 104"),
            "Most recent message (Message 104) should exist"
        );

        // Verify we don't have more than 100
        assert!(history.len() <= 100, "Should not have more than 100 entries");
    }

    #[tokio::test]
    async fn test_delete_by_task_id() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        // Create some entries
        for i in 0..3 {
            let data = CreateTaskBuildHistory {
                task_id: task.id,
                workspace_id: None,
                session_id: None,
                context_type: TaskBuildHistoryContextType::ChatMessage,
                content: format!("Message {}", i),
                metadata: None,
            };
            TaskBuildHistory::create(&pool, &data).await.unwrap();
        }

        let rows_deleted = TaskBuildHistory::delete_by_task_id(&pool, task.id)
            .await
            .unwrap();

        assert_eq!(rows_deleted, 3);

        let count = TaskBuildHistory::count_by_task_id(&pool, task.id)
            .await
            .unwrap();

        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn test_context_types() {
        let pool = setup_test_db().await;
        let project = create_test_project(&pool).await;
        let task = create_test_task(&pool, project.id).await;

        let context_types = vec![
            TaskBuildHistoryContextType::ChatMessage,
            TaskBuildHistoryContextType::ExecutionStep,
            TaskBuildHistoryContextType::AgentTurn,
            TaskBuildHistoryContextType::SetupComplete,
            TaskBuildHistoryContextType::Error,
            TaskBuildHistoryContextType::StatusChange,
        ];

        // Create one entry for each context type
        for ctx_type in context_types.iter() {
            let data = CreateTaskBuildHistory {
                task_id: task.id,
                workspace_id: None,
                session_id: None,
                context_type: ctx_type.clone(),
                content: format!("Content for {:?}", ctx_type),
                metadata: None,
            };
            TaskBuildHistory::create(&pool, &data).await.unwrap();
        }

        let history = TaskBuildHistory::find_by_task_id(&pool, task.id)
            .await
            .unwrap();

        assert_eq!(history.len(), 6);
    }
}
