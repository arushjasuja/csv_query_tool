# CSV Query Tool

Web-based SQL query interface for CSV files up to 1GB. Built with DuckDB-WASM for high-performance analytics entirely in the browser.

## Quick Start

1. Clone repository
2. Open `index.html` in browser (or deploy to Netlify)
3. Upload CSV file
4. Write SQL query against table named `tablename`
5. Click "Execute Query" or press Ctrl+Enter

## Live Demo

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/)

Or use the Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy
```

## Architecture

**Client-side processing**: Data never leaves browser. DuckDB-WASM handles all SQL execution locally.

**Key components**:
- DuckDB-WASM v1.30.0 for SQL engine
- Vanilla JavaScript (ES6+)
- No backend required
- Zero dependencies beyond DuckDB-WASM

### Why Client-Side?

For security-sensitive data analysis (threat hunting, log analysis), keeping data local is critical. This architecture ensures sensitive data never leaves the user's machine.

## Features

- SQL queries on files up to 1GB
- Full SQL support (GROUP BY, JOIN, window functions)
- Sub-second query execution
- Result pagination for large outputs
- Security: Only SELECT queries allowed
- Browser-based (no server required)

## Performance Benchmarks

| File Size | Load Time | SELECT | GROUP BY |
|-----------|-----------|--------|----------|
| 10 MB     | 150ms     | 32ms   | 156ms    |
| 100 MB    | 890ms     | 87ms   | 412ms    |
| 1 GB      | 4.2s      | 398ms  | 3.8s     |

*Tested on: Chrome 120, MacBook Pro M1, 16GB RAM*

Run your own benchmarks:
```bash
open tests/benchmark.html
```

## Running Tests

Open test files in browser:
- `tests/benchmark.html` - Latency tests
- `tests/throughput.html` - Throughput tests
- `tests/security.html` - SQL injection prevention
- `tests/correctness.html` - Query accuracy

All tests run in-browser with auto-generated data.

## Project Structure

```
csv-query-tool/
├── index.html          # Main UI
├── app.js              # DuckDB initialization + application logic
├── validate.js         # Security validation
├── styles.css          # Styling
├── tests/              # Automated tests
│   ├── benchmark.html
│   ├── throughput.html
│   ├── security.html
│   └── correctness.html
├── README.md
└── netlify.toml        # Deployment config
```

## Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repository to Netlify
3. Deploy (no build command needed)
4. Verify COOP/COEP headers in browser DevTools

Headers are automatically configured via `netlify.toml`.

### Local Development

Open `index.html` in browser. For SharedArrayBuffer support:

```bash
# Python 3 with proper headers
python -m http.server 8000
```

Then visit http://localhost:8000

**Note**: Local development requires proper COOP/COEP headers. Use a web server, not `file://` protocol.

## Security

- **Read-only**: Only SELECT queries allowed
- **Validation**: Blocks DROP, DELETE, INSERT, UPDATE, CREATE
- **No data exfiltration**: All processing in browser
- **CSP**: Content Security Policy prevents XSS
- **Isolation**: SharedArrayBuffer with COOP/COEP

## Browser Requirements

- Chrome 92+ / Firefox 95+ / Safari 15.2+
- SharedArrayBuffer support (requires COOP/COEP headers)
- Minimum 4GB RAM for large files

## Example Queries

```sql
-- Basic select
SELECT * FROM tablename LIMIT 10;

-- Aggregation
SELECT department, AVG(salary) as avg_salary 
FROM tablename 
GROUP BY department 
ORDER BY avg_salary DESC;

-- Window function
SELECT name, salary, 
       AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM tablename;

-- Complex analytical
SELECT 
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary,
  MAX(salary) as max_salary
FROM tablename
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;

-- Date filtering
SELECT name, hire_date 
FROM tablename 
WHERE hire_date >= '2020-01-01';

-- Self-join
SELECT 
  a.name as emp1,
  b.name as emp2,
  a.department
FROM tablename a
JOIN tablename b ON a.department = b.department
WHERE a.employee_id < b.employee_id
LIMIT 10;
```

## Limitations

- Browser memory constraints (~4GB for WASM)
- Very complex JOINs on 1GB files may be slow
- Safari has more conservative memory allocation

## Tech Stack

- DuckDB-WASM 1.30.0
- Vanilla JavaScript (ES6+)
- HTML5 / CSS3
- No build tools required

## Development

To modify the application:

1. Edit source files directly (no build step)
2. Test locally with a web server
3. Verify security validation in `validate.js`
4. Run all tests before committing

## Troubleshooting

**SharedArrayBuffer not available**:
- Ensure HTTPS connection (required)
- Verify COOP/COEP headers are set
- Check browser version compatibility

**Out of memory errors**:
- Reduce file size
- Simplify query
- Close other browser tabs

**Slow query performance**:
- Add WHERE clause to filter early
- Avoid SELECT * on large tables
- Use LIMIT for exploratory queries

## Use Cases

- Security log analysis
- CSV data exploration
- Local ETL workflows
- Data quality checks
- Ad-hoc analytics

## License

MIT
