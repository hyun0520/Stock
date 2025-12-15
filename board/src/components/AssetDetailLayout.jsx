export default function AssetDetailLayout({
  title,
  market,
  price,
  changeRate,
  chart,
  onAddWatchlist,
  onAddPortfolio,
}) {
  return (
    <>
      <h1>{title} ({market})</h1>

      <h3 className={changeRate >= 0 ? "up" : "down"}>
        현재가: {price.toLocaleString()}
        {changeRate >= 0 ? " ▲" : " ▼"} {changeRate.toFixed(2)}%
      </h3>

      <div className="chart-box">{chart}</div>

      <div className="action-buttons">
        <button onClick={onAddWatchlist}>⭐ 관심종목 추가</button>
        <button onClick={onAddPortfolio}>💼 포트폴리오 추가</button>
      </div>
    </>
  );
}
