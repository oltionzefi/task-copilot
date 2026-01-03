use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{delete, get, patch, post},
};
use db::models::portfolio::{CreatePortfolio, Portfolio, UpdatePortfolio};
use deployment::Deployment;
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::{DeploymentImpl, error::ApiError};

pub async fn get_portfolios(
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<Vec<Portfolio>>>, ApiError> {
    let portfolios = Portfolio::find_all(&deployment.db().pool).await?;
    Ok(ResponseJson(ApiResponse::success(portfolios)))
}

pub async fn get_portfolio(
    State(deployment): State<DeploymentImpl>,
    Path(id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Portfolio>>, ApiError> {
    let portfolio = Portfolio::find_by_id(&deployment.db().pool, id)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Portfolio not found".to_string()))?;
    Ok(ResponseJson(ApiResponse::success(portfolio)))
}

pub async fn create_portfolio(
    State(deployment): State<DeploymentImpl>,
    Json(data): Json<CreatePortfolio>,
) -> Result<(StatusCode, ResponseJson<ApiResponse<Portfolio>>), ApiError> {
    let portfolio_id = Uuid::now_v7();
    let portfolio = Portfolio::create(&deployment.db().pool, &data, portfolio_id).await?;
    Ok((
        StatusCode::CREATED,
        ResponseJson(ApiResponse::success(portfolio)),
    ))
}

pub async fn update_portfolio(
    State(deployment): State<DeploymentImpl>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdatePortfolio>,
) -> Result<ResponseJson<ApiResponse<Portfolio>>, ApiError> {
    let portfolio = Portfolio::update(&deployment.db().pool, id, &data).await?;
    Ok(ResponseJson(ApiResponse::success(portfolio)))
}

pub async fn delete_portfolio(
    State(deployment): State<DeploymentImpl>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let deleted = Portfolio::delete(&deployment.db().pool, id).await?;
    if deleted == 0 {
        return Err(ApiError::BadRequest("Portfolio not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route("/portfolios", get(get_portfolios).post(create_portfolio))
        .route(
            "/portfolios/:id",
            get(get_portfolio)
                .patch(update_portfolio)
                .delete(delete_portfolio),
        )
        .with_state(deployment.clone())
}
