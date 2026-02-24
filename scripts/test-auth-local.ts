// Script de teste local para endpoints de auth
// Executa: npx tsx scripts/test-auth-local.ts

import { config } from 'dotenv'
config()

const API_URL = process.env.VITE_API_URL || 'https://zmauhpjprcxszjrahoqb.supabase.co/functions/v1/api-fastify'
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

interface LoginResponse {
  user?: {
    id: string
    email: string
    name: string
    perfil_tipo: string
  }
  clinicas?: Array<{
    id: string
    name: string
    permissoes: Record<string, unknown>
  }>
  session?: {
    access_token: string
    refresh_token: string
  }
  error?: string
}

interface UserWithClinicsResponse {
  user?: {
    id: string
    email: string
    name: string
    perfil_tipo: string
  }
  clinicas?: Array<{
    id: string
    name: string
    permissoes: Record<string, unknown>
  }>
  error?: string
}

async function testLogin(email: string, password: string): Promise<LoginResponse> {
  console.log(`\n🔐 Testando login: ${email}`)

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json() as LoginResponse

  if (response.ok && data.user) {
    console.log(`✅ Login OK - Status: ${response.status}`)
    console.log(`   User: ${data.user.name} (${data.user.perfil_tipo})`)
    console.log(`   Clínicas: ${data.clinicas?.length || 0}`)
    data.clinicas?.forEach((c, i) => {
      console.log(`     ${i + 1}. ${c.name} (${c.id.slice(0, 8)}...)`)
    })
  } else {
    console.log(`❌ Login FALHOU - Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
  }

  return data
}

async function testUserWithClinics(token: string): Promise<UserWithClinicsResponse> {
  console.log(`\n👤 Testando /api/auth/user-with-clinics`)

  const response = await fetch(`${API_URL}/api/auth/user-with-clinics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json() as UserWithClinicsResponse

  if (response.ok && data.user) {
    console.log(`✅ User-with-clinics OK - Status: ${response.status}`)
    console.log(`   User: ${data.user.name} (${data.user.perfil_tipo})`)
    console.log(`   Clínicas: ${data.clinicas?.length || 0}`)
    data.clinicas?.forEach((c, i) => {
      console.log(`     ${i + 1}. ${c.name}`)
    })
  } else {
    console.log(`❌ User-with-clinics FALHOU - Status: ${response.status}`)
    console.log(`   Erro: ${data.error}`)
  }

  return data
}

async function main() {
  console.log('=' .repeat(60))
  console.log('🧪 TESTE DE AUTENTICAÇÃO - ALLYRA')
  console.log('=' .repeat(60))
  console.log(`API: ${API_URL}`)

  // Testar usuários de diferentes perfis
  // Usuários disponíveis no CLAUDE.md:
  // admin.master@allyra.com.br / senha123 (admin_master)
  // admin@clinicademo.com.br / senha123 (administrador_total)
  // profissional@clinicademo.com.br / senha123 (profissional)
  // secretaria@clinicademo.com.br / senha123 (secretaria)

  // Configure seu usuário de teste aqui
  const testUsers = [
    { email: process.env.TEST_USER_EMAIL || 'test@example.com', password: process.env.TEST_USER_PASSWORD || 'password', perfil: 'desenvolvedor' },
  ]

  for (const user of testUsers) {
    console.log('\n' + '-'.repeat(60))
    console.log(`📋 Testando perfil: ${user.perfil}`)

    // 1. Testar login
    const loginResult = await testLogin(user.email, user.password)

    if (loginResult.session?.access_token) {
      // 2. Testar user-with-clinics com o token obtido
      await testUserWithClinics(loginResult.session.access_token)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 TESTE CONCLUÍDO')
  console.log('='.repeat(60))
}

main().catch(console.error)
