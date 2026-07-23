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
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL
const DEV_USER_PASSWORD = process.env.DEV_USER_PASSWORD
const DEV_USER_NOME = process.env.DEV_USER_NOME || 'Desenvolvedor'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEV_USER_EMAIL || !DEV_USER_PASSWORD) {
  console.error('❌ Variáveis de ambiente obrigatórias ausentes')
  console.log('Certifique-se de que .env.local contém:')
  console.log('  VITE_SUPABASE_URL=https://xxx.supabase.co')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=xxx')
  console.log('  DEV_USER_EMAIL=dev@example.com')
  console.log('  DEV_USER_PASSWORD=xxx')
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
    email: DEV_USER_EMAIL,
    password: DEV_USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      nome: DEV_USER_NOME,
      perfil_tipo: 'desenvolvedor',
    },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('⚠️ Usuário já existe. Tentando atualizar...')

      // Buscar usuário existente
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users.find((u) => u.email === DEV_USER_EMAIL)

      if (existingUser) {
        // Atualizar usuário
        const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: DEV_USER_PASSWORD,
            email_confirm: true,
            user_metadata: {
              nome: DEV_USER_NOME,
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
}

createDevUser()
