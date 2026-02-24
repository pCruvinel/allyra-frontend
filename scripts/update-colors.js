/**
 * Script de Substituição de Cores - Allyra
 *
 * Substitui cores hardcoded (#0B9036 verde) pelas novas classes brand (roxo)
 *
 * Uso: node scripts/update-colors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de substituições (ordem importa - mais específico primeiro)
const replacements = [
  // Opacidades específicas primeiro
  ['bg-\\[#0B9036\\]/10', 'bg-brand-primary-light'],
  ['bg-\\[#0B9036\\]/5', 'bg-brand-primary-light'],
  ['hover:bg-\\[#0B9036\\]/90', 'hover:bg-brand-primary-hover'],
  ['hover:bg-\\[#0B9036\\]/10', 'hover:bg-brand-primary-light'],
  ['focus:ring-\\[#0B9036\\]/20', 'focus:ring-brand-primary/20'],
  ['hover:border-\\[#0B9036\\]/30', 'hover:border-brand-primary/30'],

  // Data states
  ['data-\\[state=checked\\]:bg-\\[#0B9036\\]', 'data-[state=checked]:bg-brand-primary'],
  ['data-\\[state=checked\\]:border-\\[#0B9036\\]', 'data-[state=checked]:border-brand-primary'],
  ['data-\\[state=active\\]:border-\\[#0B9036\\]', 'data-[state=active]:border-brand-primary'],
  ['data-\\[state=active\\]:text-\\[#0B9036\\]', 'data-[state=active]:text-brand-primary'],

  // Hover/Focus states
  ['hover:bg-\\[#0B9036\\]', 'hover:bg-brand-primary-hover'],
  ['hover:border-\\[#0B9036\\]', 'hover:border-brand-primary'],
  ['hover:text-\\[#0B9036\\]', 'hover:text-brand-primary'],
  ['focus:border-\\[#0B9036\\]', 'focus:border-brand-primary'],
  ['focus:ring-\\[#0B9036\\]', 'focus:ring-brand-primary'],

  // Base classes
  ['bg-\\[#0B9036\\]', 'bg-brand-primary'],
  ['text-\\[#0B9036\\]', 'text-brand-primary'],
  ['border-\\[#0B9036\\]', 'border-brand-primary'],
  ['ring-\\[#0B9036\\]', 'ring-brand-primary'],

  // Fill para ícones
  ['fill="#0B9036"', 'fill="currentColor"'],

  // Outras cores verdes relacionadas
  ['bg-\\[#E8F5E9\\]', 'bg-brand-primary-light'],
  ['bg-\\[#15D51B\\]', 'bg-brand-primary'],
  ['text-\\[#15D51B\\]', 'text-brand-primary'],

  // Cores de borda específicas
  ['border-\\[#D0D5DD\\]', 'border-border-muted'],
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
console.log('🎨 Iniciando substituição de cores...\n');
console.log(`📁 Diretório: ${srcDir}\n`);

walkDir(srcDir);

console.log('\n' + '='.repeat(50));
console.log(`✅ Concluído!`);
console.log(`   📄 Arquivos modificados: ${filesModified}`);
console.log(`   🔄 Total de substituições: ${totalReplacements}`);
console.log('='.repeat(50));
