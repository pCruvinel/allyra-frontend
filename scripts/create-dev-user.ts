/**
 * Script para criar usuário desenvolvedor via Supabase Admin API
 *
 * Executar: npx tsx scripts/create-dev-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Carregar variáveis de ambiente (tenta .env.local primeiro, depois .env)
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  console.log('Certifique-se de que .env.local contém:')
  console.log('  VITE_SUPABASE_URL=https://xxx.supabase.co')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=xxx')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createDevUser() {
  console.log('🚀 Criando usuário desenvolvedor...')

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'gestao@doed.com.br',
    password: '***REMOVED***',
    email_confirm: true,
    user_metadata: {
      nome: 'Douglas Oliveira',
      perfil_tipo: 'desenvolvedor',
    },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('⚠️ Usuário já existe. Tentando atualizar...')

      // Buscar usuário existente
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users.find((u) => u.email === 'gestao@doed.com.br')

      if (existingUser) {
        // Atualizar usuário
        const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: '***REMOVED***',
            email_confirm: true,
            user_metadata: {
              nome: 'Douglas Oliveira',
              perfil_tipo: 'desenvolvedor',
            },
          }
        )

        if (updateError) {
          console.error('❌ Erro ao atualizar usuário:', updateError.message)
          process.exit(1)
        }

        console.log('✅ Usuário atualizado com sucesso!')
        console.log('   ID:', updated.user.id)
        console.log('   Email:', updated.user.email)
        return
      }
    }

    console.error('❌ Erro ao criar usuário:', error.message)
    process.exit(1)
  }

  console.log('✅ Usuário criado com sucesso!')
  console.log('   ID:', data.user.id)
  console.log('   Email:', data.user.email)
  console.log('')
  console.log('📝 Credenciais:')
  console.log('   Email: gestao@doed.com.br')
  console.log('   Senha: ***REMOVED***')
}

createDevUser()
