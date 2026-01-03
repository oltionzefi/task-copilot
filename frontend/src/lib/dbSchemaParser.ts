import type { DbTable, DbColumn, DbRelation } from '@/components/dialogs';

interface SchemaParseResult {
  tables: DbTable[];
  relations: DbRelation[];
}

export function parseDbSchemaFromText(text: string): SchemaParseResult {
  const tables: DbTable[] = [];
  const relations: DbRelation[] = [];

  // Parse table definitions
  // Supports formats like:
  // - CREATE TABLE users (...) 
  // - Table: users
  // - ## users
  const tableRegex = /(?:CREATE\s+TABLE\s+|(?:^|\n)(?:Table|##)\s*:?\s*)(\w+)\s*[\(\{]([^\)\}]+)[\)\}]/gim;
  
  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    const tableName = match[1];
    const columnsDef = match[2];
    const columns = parseColumns(columnsDef);
    
    tables.push({
      name: tableName,
      columns,
    });
  }

  // Alternative parsing: Markdown table format
  // | Column | Type | Constraints |
  const markdownTables = parseMarkdownTables(text);
  tables.push(...markdownTables);

  // Parse relations/foreign keys
  const fkRegex = /FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
  let fkMatch;
  while ((fkMatch = fkRegex.exec(text)) !== null) {
    relations.push({
      fromTable: '', // Will be inferred from context
      fromColumn: fkMatch[1],
      toTable: fkMatch[2],
      toColumn: fkMatch[3],
      type: 'one-to-many',
    });
  }

  return { tables, relations };
}

function parseColumns(columnsDef: string): DbColumn[] {
  const columns: DbColumn[] = [];
  const lines = columnsDef.split(/[,\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Parse: column_name TYPE constraints
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    
    const name = parts[0].replace(/[`"'\[\]]/g, '');
    const type = parts[1].replace(/[,;]/g, '');
    
    const upperLine = trimmed.toUpperCase();
    const primaryKey = upperLine.includes('PRIMARY KEY') || upperLine.includes('PK');
    const foreignKey = upperLine.includes('FOREIGN KEY') || upperLine.includes('FK') || upperLine.includes('REFERENCES');
    const nullable = !upperLine.includes('NOT NULL') && !primaryKey;
    const unique = upperLine.includes('UNIQUE') || upperLine.includes('UQ');
    
    columns.push({
      name,
      type,
      primaryKey,
      foreignKey,
      nullable,
      unique,
    });
  }
  
  return columns;
}

function parseMarkdownTables(text: string): DbTable[] {
  const tables: DbTable[] = [];
  
  // Find markdown tables preceded by a table name heading
  const sections = text.split(/(?:^|\n)(?:#+\s*|Table:\s*)(\w+)/i);
  
  for (let i = 1; i < sections.length; i += 2) {
    const tableName = sections[i].trim();
    const content = sections[i + 1];
    
    if (!content) continue;
    
    // Look for markdown table
    const tableMatch = content.match(/\|(.+)\|[\s\S]*?\|([-|\s]+)\|([\s\S]*?)(?:\n\n|\n$|$)/);
    if (!tableMatch) continue;
    
    // Skip header row - we'll parse column names and types from data rows
    const dataRows = tableMatch[3].trim().split('\n');
    
    const columns: DbColumn[] = [];
    
    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      
      const name = cells[0];
      const type = cells[1];
      const constraints = cells[2]?.toUpperCase() || '';
      
      columns.push({
        name,
        type,
        primaryKey: constraints.includes('PK') || constraints.includes('PRIMARY'),
        foreignKey: constraints.includes('FK') || constraints.includes('FOREIGN'),
        nullable: !constraints.includes('NOT NULL') && !constraints.includes('NN'),
        unique: constraints.includes('UNIQUE') || constraints.includes('UQ'),
      });
    }
    
    if (columns.length > 0) {
      tables.push({ name: tableName, columns });
    }
  }
  
  return tables;
}

export function generateExampleSchema(): SchemaParseResult {
  return {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true, nullable: false },
          { name: 'email', type: 'VARCHAR(255)', unique: true, nullable: false },
          { name: 'username', type: 'VARCHAR(100)', unique: true, nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false },
        ],
        position: { x: 50, y: 50 },
      },
      {
        name: 'posts',
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true, nullable: false },
          { name: 'user_id', type: 'UUID', foreignKey: true, nullable: false },
          { name: 'title', type: 'VARCHAR(200)', nullable: false },
          { name: 'content', type: 'TEXT', nullable: true },
          { name: 'published', type: 'BOOLEAN', nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false },
        ],
        position: { x: 400, y: 50 },
      },
      {
        name: 'comments',
        columns: [
          { name: 'id', type: 'UUID', primaryKey: true, nullable: false },
          { name: 'post_id', type: 'UUID', foreignKey: true, nullable: false },
          { name: 'user_id', type: 'UUID', foreignKey: true, nullable: false },
          { name: 'content', type: 'TEXT', nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false },
        ],
        position: { x: 750, y: 50 },
      },
    ],
    relations: [
      {
        fromTable: 'posts',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        type: 'one-to-many',
      },
      {
        fromTable: 'comments',
        fromColumn: 'post_id',
        toTable: 'posts',
        toColumn: 'id',
        type: 'one-to-many',
      },
      {
        fromTable: 'comments',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        type: 'one-to-many',
      },
    ],
  };
}
