use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use strum_macros::{Display, EnumString};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS, EnumString, Display)]
#[sqlx(type_name = "task_history_event_type", rename_all = "lowercase")]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum TaskHistoryEventType {
    StatusChanged,
    DescriptionChanged,
    TitleChanged,
    PrBodyUpdated,
    ChangeRequested,
    Other,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct TaskHistory {
    pub id: Uuid,
    pub task_id: Uuid,
    pub event_type: TaskHistoryEventType,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub metadata: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskHistory {
    pub task_id: Uuid,
    pub event_type: TaskHistoryEventType,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub metadata: Option<String>,
}

impl TaskHistory {
    pub async fn create(pool: &SqlitePool, data: &CreateTaskHistory) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        sqlx::query_as!(
            TaskHistory,
            r#"INSERT INTO task_history (id, task_id, event_type, old_value, new_value, metadata)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   event_type as "event_type!: TaskHistoryEventType",
                   old_value,
                   new_value,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.event_type,
            data.old_value,
            data.new_value,
            data.metadata
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskHistory,
            r#"SELECT 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   event_type as "event_type!: TaskHistoryEventType",
                   old_value,
                   new_value,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>"
               FROM task_history
               WHERE task_id = $1
               ORDER BY created_at DESC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_task_id_paginated(
        pool: &SqlitePool,
        task_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskHistory,
            r#"SELECT 
                   id as "id!: Uuid",
                   task_id as "task_id!: Uuid",
                   event_type as "event_type!: TaskHistoryEventType",
                   old_value,
                   new_value,
                   metadata,
                   created_at as "created_at!: DateTime<Utc>"
               FROM task_history
               WHERE task_id = $1
               ORDER BY created_at DESC
               LIMIT $2 OFFSET $3"#,
            task_id,
            limit,
            offset
        )
        .fetch_all(pool)
        .await
    }
}
