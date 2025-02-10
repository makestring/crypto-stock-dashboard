$(document).ready(function () {
    fetchCryptoData();
    fetchStockData("brazil");
    fetchStockData("usa");
});

function fetchCryptoData() {
    $.get("/get_crypto_data", function (data) {
        let table = $("#crypto-table");
        table.empty();
        data.forEach(crypto => {
            table.append(`
                <tr>
                    <td>${crypto.symbol}</td>
                    <td>${crypto.price.toFixed(2)}</td>
                    <td>${crypto.change.toFixed(2)}%</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="showGraph('crypto', '${crypto.symbol}')">Graph</button>
                        <button class="btn btn-danger btn-sm" onclick="removeAsset('crypto', '${crypto.symbol}')">Remove</button>
                    </td>
                </tr>
            `);
        });
    });
}

function fetchStockData(market) {
    $.get(`/get_stock_data/${market}`, function (data) {
        let table = $(`#${market}-table`);
        table.empty();
        data.forEach(stock => {
            table.append(`
                <tr>
                    <td>${stock.symbol}</td>
                    <td>${stock.price.toFixed(2)}</td>
                    <td>${stock.change.toFixed(2)}%</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="showGraph('${market}', '${stock.symbol}')">Graph</button>
                        <button class="btn btn-danger btn-sm" onclick="removeAsset('${market}', '${stock.symbol}')">Remove</button>
                    </td>
                </tr>
            `);
        });
    });
}

function addAsset(market) {
    $("#addAssetModal").modal("show");
    window.currentMarket = market; // Store the current market
}

function submitAddAsset() {
    let symbol = $("#assetSymbol").val();
    if (symbol) {
        $.post(`/add_asset/${window.currentMarket}`, { symbol: symbol }, function (response) {
            if (response.success) {
                alert(`Added ${symbol} to ${window.currentMarket} assets.`);
                location.reload(); // Refresh the page to reflect changes
            } else {
                alert("Failed to add asset.");
            }
        });
    }
    $("#addAssetModal").modal("hide");
}

function removeAsset(market, symbol) {
    if (confirm(`Are you sure you want to remove ${symbol}?`)) {
        $.post(`/remove_asset/${market}`, { symbol: symbol }, function (response) {
            if (response.success) {
                alert(`Removed ${symbol} from ${market} assets.`);
                location.reload(); // Refresh the page to reflect changes
            } else {
                alert("Failed to remove asset.");
            }
        });
    }
}

let currentMarket, currentSymbol;

function showGraph(market, symbol) {
    currentMarket = market;
    currentSymbol = symbol;
    updateGraph(); // Fetch and display graph for the default timeframe
    $("#graphModal").modal("show");
}

function updateGraph() {
    let timeframe = $("#timeframe").val();
    $.get(`/get_historical_data/${currentMarket}/${currentSymbol}?timeframe=${timeframe}`, function (data) {
        let labels = Object.keys(data).reverse();
        let prices = labels.map(date => data[date]["Close"]);

        if (assetChart) {
            assetChart.destroy(); // Destroy existing chart
        }

        let ctx = document.getElementById("assetChart").getContext("2d");
        assetChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentSymbol} Price`,
                    data: prices,
                    borderColor: "rgba(75, 192, 192, 1)",
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "day"
                        }
                    }
                }
            }
        });
    });
}

function showGraph(market, symbol) {
    currentMarket = market;
    currentSymbol = symbol;
    updateGraph(); // Fetch and display graph for the default timeframe
    $("#graphModal").modal("show");
}

function updateGraph() {
    let timeframe = $("#timeframe").val();
    $.get(`/get_historical_data/${currentMarket}/${currentSymbol}?timeframe=${timeframe}`, function (data) {
        if (data.error) {
            alert(data.error);
            return;
        }
        let labels = Object.keys(data).reverse();
        let prices = labels.map(date => data[date]["Close"]);

        if (assetChart) {
            assetChart.destroy(); // Destroy existing chart
        }

        let ctx = document.getElementById("assetChart").getContext("2d");
        assetChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentSymbol} Price`,
                    data: prices,
                    borderColor: "rgba(75, 192, 192, 1)",
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "day"
                        }
                    }
                }
            }
        });
    }).fail(function (error) {
        alert("Failed to fetch historical data.");
    });
}
