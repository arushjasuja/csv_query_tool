import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.30.0/+esm';

let db = null;
let conn = null;
let currentFile = null;

async function initDuckDB() {
  try {
    showLoading('Initializing DuckDB...');
    
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
    );
    
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);
    
    conn = await db.connect();
    await conn.query("PRAGMA memory_limit='4GB'");
    
    hideLoading();
    enableFileUpload();
    showMessage('Ready - upload a CSV file to begin');
  } catch (error) {
    showError(`Initialization failed: ${error.message}`);
    console.error('DuckDB initialization error:', error);
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    validateFile(file);
    showLoading(`Loading ${file.name}...`);
    disableQueryButton();
    
    await db.registerFileHandle('upload.csv', file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
    
    try {
      await conn.query('DROP TABLE IF EXISTS tablename');
    } catch (e) {
      // Table might not exist
    }
    
    await conn.query("CREATE TABLE tablename AS SELECT * FROM read_csv_auto('upload.csv')");
    
    currentFile = file;
    displayFileInfo(file);
    enableQueryButton();
    hideLoading();
    showMessage(`Loaded ${file.name} (${formatBytes(file.size)}) - ready to query`);
  } catch (error) {
    showError(`File load failed: ${error.message}`);
    console.error('File load error:', error);
  }
}

async function handleQueryExecution() {
  const queryInput = document.getElementById('query');
  const query = queryInput.value.trim();
  
  if (!currentFile) {
    showError('Please upload a CSV file first');
    return;
  }
  
  if (!query) {
    showError('Please enter a SQL query');
    return;
  }
  
  try {
    validateQuery(query);
    showLoading('Executing query...');
    
    const startTime = performance.now();
    const result = await conn.query(query);
    const executionTime = performance.now() - startTime;
    
    const rows = result.toArray().map(row => Object.fromEntries(row));
    
    displayResults(rows, executionTime);
  } catch (error) {
    let errorMsg = error.message;
    
    if (errorMsg.includes('Parser Error')) {
      errorMsg = 'SQL syntax error: ' + errorMsg.split('\n')[0];
    } else if (errorMsg.includes('Catalog Error') && errorMsg.includes('tablename')) {
      errorMsg = 'Table "tablename" not found. Make sure you uploaded a CSV file.';
    } else if (errorMsg.includes('Binder Error')) {
      errorMsg = 'Invalid column reference in query';
    } else if (errorMsg.includes('Out of Memory')) {
      errorMsg = 'Query exceeded memory limit. Try a simpler query or smaller file.';
    }
    
    showError(`Query failed: ${errorMsg}`);
    console.error('Query execution error:', error);
  }
}

function displayResults(rows, executionTime) {
  hideLoading();
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  
  if (rows.length === 0) {
    const p = document.createElement('p');
    p.className = 'no-results';
    p.textContent = 'Query returned 0 rows';
    resultsDiv.appendChild(p);
    showMessage(`Query completed in ${executionTime.toFixed(2)}ms`);
    return;
  }
  
  const PAGE_SIZE = 1000;
  const displayRows = rows.length > PAGE_SIZE ? rows.slice(0, PAGE_SIZE) : rows;
  
  const table = document.createElement('table');
  const thead = table.createTHead();
  const tbody = table.createTBody();
  
  const headerRow = thead.insertRow();
  Object.keys(displayRows[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  
  displayRows.forEach(row => {
    const tr = tbody.insertRow();
    Object.values(row).forEach(value => {
      const td = tr.insertCell();
      if (value === null) {
        td.textContent = 'NULL';
        td.className = 'null-value';
      } else {
        td.textContent = value;
      }
    });
  });
  
  resultsDiv.appendChild(table);
  
  const stats = rows.length > PAGE_SIZE
    ? `Showing ${PAGE_SIZE.toLocaleString()} of ${rows.length.toLocaleString()} rows | ${executionTime.toFixed(2)}ms`
    : `${rows.length.toLocaleString()} rows | ${executionTime.toFixed(2)}ms`;
  showMessage(stats);
}

function displayFileInfo(file) {
  document.getElementById('file-info').textContent = 
    `${file.name} (${formatBytes(file.size)})`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showError(msg) {
  hideLoading();
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'error';
  statusDiv.textContent = msg;
}

function showMessage(msg) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'success';
  statusDiv.textContent = msg;
}

function showLoading(msg) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'loading';
  statusDiv.textContent = msg || 'Loading...';
}

function hideLoading() {
  const statusDiv = document.getElementById('status');
  if (statusDiv.className === 'loading') {
    statusDiv.className = '';
    statusDiv.textContent = '';
  }
}

function enableFileUpload() {
  document.getElementById('file-input').disabled = false;
}

function enableQueryButton() {
  const queryTextarea = document.getElementById('query');
  const executeBtn = document.getElementById('execute-btn');
  queryTextarea.disabled = false;
  executeBtn.disabled = false;
}

function disableQueryButton() {
  document.getElementById('execute-btn').disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
  initDuckDB();
  
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  document.getElementById('execute-btn').addEventListener('click', handleQueryExecution);
  
  document.getElementById('query').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleQueryExecution();
    }
  });
});
