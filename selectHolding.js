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
var sqlSelect = "SELECT * FROM portfolio_snapshot_latest ORDER BY InvestmentName";
pool.query(sqlSelect, function (err, pslData){
  if (err) throw err;

  // Load Portfolio Table
  var selectTable = document.getElementById('holdingTable');
  for(var i = 0; i < pslData.length; i++){
      var holdingRow = selectTable.insertRow(i+1);
      var holdingCell1 = holdingRow.insertCell(0);
      holdingCell1.innerHTML = pslData[i].InvestmentName + ' (' + pslData[i].InvestmentCode + ')';
  };

  // Add click event listener and handler to all rows
  var tableDetail = document.querySelectorAll('#holdingTable td');
  for(i = 0; i < tableDetail.length; i++){
    tableDetail[i].addEventListener("click", function(evt) {

      // Isolate Holding
      var selectedLine = evt.srcElement.innerHTML;
      var startPos = selectedLine.lastIndexOf("(");
      var endPos = selectedLine.lastIndexOf(")");
      var selectedHolding = selectedLine.substring(startPos+1, endPos);

      // Return to Holding Profile Window
      const {ipcRenderer} = require('electron');
      ipcRenderer.send('selHoldingTable', selectedHolding);
    });
  };
});
