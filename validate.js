function validateQuery(query) {
  const BLOCKED_PATTERNS = [
    /\bDROP\b/i,
    /\bDELETE\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bCREATE\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i
  ];
  
  const upperQuery = query.toUpperCase();
  
  if (!upperQuery.includes('SELECT')) {
    throw new Error('Query must contain SELECT statement');
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) {
      const operation = query.match(pattern)[0];
      throw new Error(`Operation "${operation}" not allowed. Only SELECT queries permitted.`);
    }
  }
  
  return true;
}

function validateFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Only CSV files are allowed');
  }
  
  const MAX_SIZE = 1024 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    const sizeMB = Math.round(file.size / 1024 / 1024);
    throw new Error(`File too large (${sizeMB}MB). Maximum size: 1024MB`);
  }
  
  if (file.size === 0) {
    throw new Error('File is empty');
  }
  
  return true;
}
