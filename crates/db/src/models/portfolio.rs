use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Executor, FromRow, Sqlite, SqlitePool};
use thiserror::Error;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum PortfolioError {
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error("Portfolio not found")]
    PortfolioNotFound,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct Portfolio {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub theme: Option<String>,
    #[ts(type = "Date")]
    pub created_at: DateTime<Utc>,
    #[ts(type = "Date")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize, TS)]
pub struct CreatePortfolio {
    pub name: String,
    pub description: Option<String>,
    pub theme: Option<String>,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdatePortfolio {
    pub name: Option<String>,
    pub description: Option<String>,
    pub theme: Option<String>,
}

impl Portfolio {
    pub async fn find_all(pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            Portfolio,
            r#"SELECT id as "id!: Uuid",
                      name,
                      description,
                      theme,
                      created_at as "created_at!: DateTime<Utc>",
                      updated_at as "updated_at!: DateTime<Utc>"
               FROM portfolios
               ORDER BY created_at DESC"#
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Portfolio,
            r#"SELECT id as "id!: Uuid",
                      name,
                      description,
                      theme,
                      created_at as "created_at!: DateTime<Utc>",
                      updated_at as "updated_at!: DateTime<Utc>"
               FROM portfolios
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        executor: impl Executor<'_, Database = Sqlite>,
        data: &CreatePortfolio,
        portfolio_id: Uuid,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            Portfolio,
            r#"INSERT INTO portfolios (
                    id,
                    name,
                    description,
                    theme
                ) VALUES (
                    $1, $2, $3, $4
                )
                RETURNING id as "id!: Uuid",
                          name,
                          description,
                          theme,
                          created_at as "created_at!: DateTime<Utc>",
                          updated_at as "updated_at!: DateTime<Utc>""#,
            portfolio_id,
            data.name,
            data.description,
            data.theme,
        )
        .fetch_one(executor)
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        payload: &UpdatePortfolio,
    ) -> Result<Self, sqlx::Error> {
        let existing = Self::find_by_id(pool, id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let name = payload.name.clone().unwrap_or(existing.name);
        let description = payload.description.clone().or(existing.description);
        let theme = payload.theme.clone().or(existing.theme);

        sqlx::query_as!(
            Portfolio,
            r#"UPDATE portfolios
               SET name = $2, description = $3, theme = $4
               WHERE id = $1
               RETURNING id as "id!: Uuid",
                         name,
                         description,
                         theme,
                         created_at as "created_at!: DateTime<Utc>",
                         updated_at as "updated_at!: DateTime<Utc>""#,
            id,
            name,
            description,
            theme,
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM portfolios WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
