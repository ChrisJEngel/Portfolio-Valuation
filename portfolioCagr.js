// Get random color generator for Charts
var randomColor = require('./node_modules/randomcolor')

// Connect to database
const mysql = require('./node_modules/mysql');
const pool = mysql.createPool({
      connectionLimit:100,
      host: 'localhost',
      user: 'ChrisEngel',
      password: 'cengel001',
      database: 'portfolio_performance',
      dateStrings:true
});

// Get latest portfolio snapshot date and balance
var sqlSelect = "SELECT * FROM portfolio_balance ORDER BY SnapshotDate DESC LIMIT 1";
pool.query(sqlSelect, function (err, pbData){
  if (err) throw err;
  asAtDate = new Date(pbData[0].SnapshotDate);
  longAsAtDate = Intl.DateTimeFormat('en-AU', {day:'numeric', month:'short', year:'numeric'}).format(asAtDate);

  // Get ranking by CAGR% for latest snapshot
  var sqlSelect = "SELECT InvestmentName,InvestmentCode,InvestmentValue,InvestmentCAGR,ROW_NUMBER() OVER(ORDER BY InvestmentCAGR DESC) as InvestmentCAGRRank FROM portfolio_snapshot WHERE SnapshotDate = '" + pbData[0].SnapshotDate + "'";
  pool.query(sqlSelect, function (err, rankData){
    if (err) throw err;
    var chartData = [{}];
    var chartLegend = [];
    var bubbleColor = [];
    for(var i = 0; i < rankData.length; i++){
      xCoord = rankData[i].InvestmentCAGRRank;
      yCoord = Number((rankData[i].InvestmentCAGR * 100).toFixed(2));
      rCoord = Number((rankData[i].InvestmentValue * 250 / pbData[0].InvestmentValueTotal).toFixed(2));
      chartData[i] = {x: xCoord, y:yCoord, r: rCoord};
      chartLegend[i] = rankData[i].InvestmentName + '(' + rankData[i].InvestmentCode + ')';
      bubbleColor[i] = randomColor({
        luminosity: 'bright',
        format: 'rgb'
      });
    };

    // Construct CAGR ranking (bubble) chart
    const Chart = require('./node_modules/chart.js');
    const ctx = document.getElementById('portfolioCagr').getContext('2d');
    const portfolioCagr = new Chart(ctx, {
      type: 'bubble',
      labels: chartLegend,
      data: {
        datasets: [{data:chartData, backgroundColor:bubbleColor}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: ['Holding CAGR Rankings as at '+longAsAtDate,'(Bubble Size depicts the share of Portfolio)'],
          fontColor:"#CD5C5C",
          fontSize:14
        },
        onClick: chartClickEvent,
        tooltips: {
          callbacks: {
            label: function(toolTipItem, data){
              var toolTipLines = [];
              toolTipLines[0] = chartLegend[toolTipItem.index] + ': CAGR% of ' + toolTipItem.yLabel + '% ranked ' + toolTipItem.xLabel + ' of ' + rankData.length;
              toolTipLines[1] = 'Latest value is ' +
              Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(rankData[toolTipItem.index].InvestmentValue.toFixed(0));
              return toolTipLines;
            }
          }
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "CAGR%"
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "CAGR Ranking"
            }
          }]
        }
      }
    });
  });
});

// Process chart click event
function chartClickEvent(evt, activeElements) {
  if (activeElements.length > 0) {
    // Isolate Holding Code the pass to Holding Profile Window
    var holdingLabel = activeElements[0]._chart.config.labels[activeElements[0]._index];
    var posLeftBracket = holdingLabel.lastIndexOf('(');
    var posRightBracket = holdingLabel.lastIndexOf(')');
    var holdingCode = holdingLabel.substring(posLeftBracket + 1, posRightBracket);
    const {ipcRenderer} = require('electron');
    ipcRenderer.send('clickPortfolioCagr', holdingCode);
  };
};
