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

  // Get latest portfolio snapshot by investment type
  var sqlSelect = "SELECT * FROM portfolio_snapshot WHERE SnapshotDate = '" + pbData[0].SnapshotDate + "'";
  pool.query(sqlSelect, function (err, psData){
    var chartLabel1 = [];
    var chartLabel2 = [];
    var chartDataset1 = [];
    var chartDataset2 = [];
    var segmentColor1 = [];
    var segmentColor2 = [];

    chartLabel2[0] = psData[0].InvestmentTypeName;
    chartDataset2[0] = 0;
    segmentColor2[0] = randomColor({
      luminosity: 'bright',
      format: 'rgb'
    });

    for(var i = 0; i < psData.length; i++){
      if (chartLabel2[chartLabel2.length-1] != psData[i].InvestmentTypeName) {
        chartLabel2.push(psData[i].InvestmentTypeName);
        chartDataset2.push(0);
        segmentColor2.push(
          randomColor({
            luminosity: 'bright',
            format: 'rgb'
          })
        );
      };

      chartDataset1[i] = psData[i].InvestmentValue;
      chartDataset2[chartDataset2.length-1] = chartDataset2[chartDataset2.length-1] + psData[i].InvestmentValue;
      chartLabel1[i] = psData[i].InvestmentName + '(' + psData[i].InvestmentCode + ')';
      segmentColor1[i] = segmentColor2[segmentColor2.length-1];
    };

    // Construct pie (doughnut) chart
    const Chart = require('./node_modules/chart.js');
    const ctx = document.getElementById('portfolioConfig').getContext('2d');
    const portfolioConfig = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels:[chartLabel1, chartLabel2],
        datasets:[{data:chartDataset1, backgroundColor:segmentColor1, hoverBackgroundColor:segmentColor1},
                  {data:chartDataset2, backgroundColor:segmentColor2, hoverBackgroundColor:segmentColor2}]
      },
      options: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            generateLabels: function(pbbtChart) {
              legendString = [{}];
              for(i = 0; i < chartLabel2.length; i++){
                legendString[i] = {
                  text:chartLabel2[i],
                  fillStyle:segmentColor2[i]
                }
              }
              return legendString;
            }
          }
        },
        title: {
          display: true,
          text: ['Portfolio Configuration by Investment Type as at '+longAsAtDate, '(Inner Ring depicts Investment Type and Outer Ring depicts the Holdings that constitute that Investment Type)'],
          fontColor:"#CD5C5C",
          fontSize:14
        },
        onClick: chartClickEvent,
        tooltips: {
          displayColors: true,
          callbacks: {
            label: function(toolTipItem, data){
              dataPoint = data.datasets[toolTipItem.datasetIndex].data[toolTipItem.index];
              return data.labels[toolTipItem.datasetIndex][toolTipItem.index] + ': Latest value is ' + Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(dataPoint.toFixed(0))
            }
          }
        }
      }
    });
  });
});

// Process chart click event
function chartClickEvent(evt, activeElements) {
  if (activeElements.length > 0) {
    if (activeElements[0]._datasetIndex == 0) {
      // Isolate Holding Code the pass to Holding Profile Window
      var holdingLabel = activeElements[0]._chart.config.data.labels[0][activeElements[0]._index];
      var posLeftBracket = holdingLabel.lastIndexOf('(');
      var posRightBracket = holdingLabel.lastIndexOf(')');
      var holdingCode = holdingLabel.substring(posLeftBracket + 1, posRightBracket);
      const {ipcRenderer} = require('electron');
      ipcRenderer.send('clickPortfolioConfig', holdingCode);
    };
  };
};
