/**
 * Script de Migração para Padrão shadcn/ui - Allyra
 *
 * Migra classes brand-* para classes primary padrão shadcn
 * Resultado: Troca de tema em 1 único arquivo CSS
 *
 * Uso: node scripts/migrate-to-shadcn.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de substituições (ordem importa - mais específico primeiro)
const replacements = [
  // Brand primary light → primary/10 ou muted
  ['bg-brand-primary-light', 'bg-primary/10'],
  ['hover:bg-brand-primary-light', 'hover:bg-primary/10'],

  // Brand primary hover → primary (darker via hover:)
  ['hover:bg-brand-primary-hover', 'hover:bg-primary/90'],
  ['bg-brand-primary-hover', 'bg-primary/90'],

  // Brand primary → primary
  ['bg-brand-primary', 'bg-primary'],
  ['text-brand-primary', 'text-primary'],
  ['border-brand-primary', 'border-primary'],
  ['ring-brand-primary', 'ring-primary'],
  ['hover:bg-brand-primary', 'hover:bg-primary'],
  ['hover:text-brand-primary', 'hover:text-primary'],
  ['hover:border-brand-primary', 'hover:border-primary'],
  ['focus:ring-brand-primary', 'focus:ring-primary'],
  ['focus:border-brand-primary', 'focus:border-primary'],

  // Data states
  ['data-\\[state=checked\\]:bg-brand-primary', 'data-[state=checked]:bg-primary'],
  ['data-\\[state=checked\\]:border-brand-primary', 'data-[state=checked]:border-primary'],
  ['data-\\[state=active\\]:border-brand-primary', 'data-[state=active]:border-primary'],
  ['data-\\[state=active\\]:text-brand-primary', 'data-[state=active]:text-primary'],

  // Border muted
  ['border-border-muted', 'border-muted'],
];

// Extensões de arquivo para processar
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

// Diretório raiz do projeto
const srcDir = path.join(__dirname, '..', 'src');

// Contador de alterações
let totalReplacements = 0;
let filesModified = 0;

/**
 * Processa um arquivo e faz as substituições
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;

  for (const [search, replace] of replacements) {
    const regex = new RegExp(search, 'g');
    const matches = content.match(regex);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(regex, replace);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements += fileReplacements;
    filesModified++;
    console.log(`✓ ${path.relative(srcDir, filePath)} (${fileReplacements} substituições)`);
  }
}

/**
 * Percorre diretório recursivamente
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules e .git
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(filePath);
    }
  }
}

// Executa
console.log('🎨 Migrando para padrão shadcn/ui...\n');
console.log(`📁 Diretório: ${srcDir}\n`);

walkDir(srcDir);

console.log('\n' + '='.repeat(50));
console.log(`✅ Migração concluída!`);
console.log(`   📄 Arquivos modificados: ${filesModified}`);
console.log(`   🔄 Total de substituições: ${totalReplacements}`);
console.log('='.repeat(50));
console.log('\n📌 Próximos passos:');
console.log('   1. Testar a aplicação (npm run dev)');
console.log('   2. Verificar se todas as cores estão corretas');
console.log('   3. Remover variáveis --brand-* do CSS (opcional)');
