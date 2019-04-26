// Get moment for date manipulation
const moment = require('./node_modules/moment');

// Isolate inbound parameter
var urlInbound = window.location.href;
var posAmpersand = urlInbound.lastIndexOf("&");
var posFirstEquals = urlInbound.indexOf("=");
var posLastEquals = urlInbound.lastIndexOf("=");

// Isolate Holding Code
var holdingCode = urlInbound.slice(posLastEquals + 1);

// Isolate Date Range
var indexRange = urlInbound.substring(posFirstEquals + 1, posAmpersand);
var startDate = calcStartDate(indexRange);
document.getElementById(indexRange).style.backgroundColor = "LightGrey";

// Only process request if inbound holding code contains a value
if (holdingCode != '') {

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

  // Get portfolio snapshots for the selected date range
  var sqlSelect = "SELECT * " +
                  "FROM portfolio_snapshot " +
                  "WHERE SnapshotDate >= '" + startDate + "' AND InvestmentCode = '" + holdingCode + "'";
  pool.query(sqlSelect, function (err, psData) {
    if (err) throw err;
    document.getElementById("holdingName").innerHTML = psData[0].InvestmentName + ":";
    document.getElementById("holdingCode").innerHTML = psData[0].InvestmentCode;
    var chartXaxis = [];
    var chart1Dataset1 = [];
    var chart2Dataset1 = [];
    var chart3Dataset1 = [];
    var chart4Dataset1 = [];
    var chartDataset2 = [];
    for(var i = 0; i < psData.length; i++){
      chartXaxis[i] = psData[i].SnapshotDate;
      chart1Dataset1[i] = (psData[i].InvestmentCAGR * 100).toFixed(2);
      chart2Dataset1[i] = psData[i].InvestmentTotalIncome.toFixed(0);
      chart3Dataset1[i] = psData[i].InvestmentValue.toFixed(0);
      chart4Dataset1[i] = psData[i].InvestmentUnitPrice.toFixed(4);
      chartDataset2[i] = psData[i].InvestmentQuantity.toFixed(2);
    };

    // Display Holding Charts
    const Chart = require('./node_modules/chart.js');
    let ctx = document.getElementById('holdingProfile1').getContext('2d');
    const holdingProfile1 = new Chart(ctx, {
      type: 'line',
      data: {
        labels:chartXaxis,
        datasets:[{borderColor:'Blue', backgroundColor:'LightBlue', pointRadius:0, data:chart1Dataset1}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: 'CAGR % Trend',
          fontColor:"#CD5C5C",
          fontSize:14
        },
        tooltips: {
          intersect: false,
          position: 'nearest',
          mode: 'index',
          displayColors: false,
          callbacks: {
            label: function(toolTipItem, data){
              return 'CAGR % is ' + toolTipItem.yLabel + '%'
            }
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                dateLabel = new Date(label)
                return Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'2-digit'}).format(dateLabel)
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "CAGR %",
              fontColor: "Blue"
            }
          }]
        }
      }
    });

    ctx = document.getElementById('holdingProfile2').getContext('2d');
    const holdingProfile2 = new Chart(ctx, {
      type: 'line',
      data: {
        labels:chartXaxis,
        datasets:[{data:chart2Dataset1, borderColor:'DimGrey', backgroundColor:'Plum', pointRadius:0}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: 'Aggregated Income',
          fontColor:"#CD5C5C",
          fontSize:14
        },
        tooltips: {
          intersect: false,
          position: 'nearest',
          mode: 'index',
          displayColors: false,
          callbacks: {
            label: function(toolTipItem, data){
              return 'Aggregated income is ' +
                      Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(toolTipItem.yLabel)
            },
            labelColor: function(toolTipItem, chart) {
              return {borderColor:'DimGrey', backgroundColor:'Plum'}
            }
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                dateLabel = new Date(label)
                return Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'2-digit'}).format(dateLabel)
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "$ Aggregated Income",
              fontColor: "DimGrey"
            },
            ticks: {
              callback: function(label, index, labels) {
                var labelNumber = new Number(label)
                return labelNumber.toLocaleString('en-AU', {minimumFractionDigits:2})
              }
            }
          }]
        }
      }
    });

    ctx = document.getElementById('holdingProfile3').getContext('2d');
    const holdingProfile3 = new Chart(ctx, {
      type: 'line',
      data: {
        labels:chartXaxis,
        datasets:[{fill:false, data:chartDataset2, yAxisID:'Qty', borderColor:'Purple', pointRadius:0},
                  {data:chart3Dataset1, yAxisID:'Value', borderColor:'Red', backgroundColor:'AntiqueWhite', pointRadius:0}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: 'Value Trend',
          fontColor:"#CD5C5C",
          fontSize:14
        },
        tooltips: {
          intersect: false,
          position: 'nearest',
          mode: 'index',
          displayColors: false,
          callbacks: {
            label: function(toolTipItem, data){
              if (toolTipItem.datasetIndex == 0) {
                return 'Quantity is ' + toolTipItem.yLabel.toLocaleString('en-AU', {maximumFractionDigits:2})
              } else {
                return 'Value is $' + toolTipItem.yLabel.toLocaleString('en-AU', {maximumFractionDigits:2})
              }
            },
            labelColor: function(toolTipItem, chart){
              if (toolTipItem.datasetIndex == 0) {
                return {borderColor:'Purple'}
              } else {
                return {borderColor:'Red', backgroundColor:'AntiqueWhite'}
              }
            }
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                dateLabel = new Date(label)
                return Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'2-digit'}).format(dateLabel)
              }
            }
          }],
          yAxes: [{
            id: "Value",
            position: "left",
            scaleLabel: {
              display: true,
              labelString: "$ Value",
              fontColor: "Red"
            },
            ticks: {
              callback: function(label, index, labels) {
                var labelNumber = new Number(label)
                return labelNumber.toLocaleString('en-AU', {minimumFractionDigits:2})
              }
            }
          }, {
            id: "Qty",
            position: "right",
            scaleLabel: {
              display: true,
              labelString: "Quantity",
              fontColor: "Purple"
            },
            ticks: {
              callback: function(label, index, labels) {
                var labelNumber = new Number(label)
                return labelNumber.toLocaleString('en-AU', {minimumFractionDigits:2})
              }
            }
          }]
        }
      }
    });

    ctx = document.getElementById('holdingProfile4').getContext('2d');
    const holdingProfile4 = new Chart(ctx, {
      type: 'line',
      data: {
        labels:chartXaxis,
        datasets:[{data:chart4Dataset1, borderColor:"SaddleBrown", backgroundColor:"LightSalmon", pointRadius:0}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: 'Unit Price Trend',
          fontColor:"#CD5C5C",
          fontSize:14
        },
        tooltips: {
          intersect: false,
          position: 'nearest',
          mode: 'index',
          displayColors: false,
          callbacks: {
            label: function(toolTipItem, data){
              return 'Unit price is ' +
                      Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:4}).format(toolTipItem.yLabel)
            },
            labelColor: function(toolTipItem, chart) {
              return {borderColor:'SaddleBrown', backgroundColor:'LightSalmon'}
            }
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                dateLabel = new Date(label)
                return Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'2-digit'}).format(dateLabel)
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "$ Unit Price",
              fontColor: "SaddleBrown"
            },
            ticks: {
              callback: function(label, index, labels) {
                var labelNumber = new Number(label)
                return labelNumber.toLocaleString('en-AU', {minimumFractionDigits:4})
              }
            }
          }]
        }
      }
    });
  });
};

// Calculate starting date for SQL Where clause
function calcStartDate(indexRange){
  switch (indexRange) {
    case "finYtd":
      startDate = finStart();
      break;
    case "calYtd":
      startDate = calStart();
      break;
    case "10d":
      startDate = datePrior(10);
      break;
    case "30d":
      startDate = datePrior(30);
      break;
    case "3m":
      startDate = mthPrior(3);
      break;
    case "6m":
      startDate = mthPrior(6);
      break;
    case "1y":
      startDate = mthPrior(12);
      break;
    default:
      startDate = "1900-01-01";
  };
  return startDate;
};

// Calculate a date x days before today
function datePrior(subDays) {
  var newDate = new Date();
  returnDate = moment(newDate, 'YYYY-MM-DD').subtract(subDays, 'days').format('YYYY-MM-DD');
  return returnDate;
};

// Calculate a date x months before today
function mthPrior(subMths) {
  var newDate = new Date();
  returnDate = moment(newDate, 'YYYY-MM-DD').subtract(subMths, 'months').format('YYYY-MM-DD');
  return returnDate;
};

// Determine Financial Year Start Date
function finStart() {
  newDate = new Date();
  if (newDate.getMonth() < 6) {
    return (newDate.getFullYear()-1) + "-07-01"
  } else {
    return newDate.getFullYear() + "-07-01"
  };
};

// Determine Calendar Year Start Date
function calStart() {
  newDate = new Date();
  return newDate.getFullYear() + "-01-01"
};
