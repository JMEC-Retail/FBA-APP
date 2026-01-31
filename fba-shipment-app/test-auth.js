// Test file to verify NextAuth v5 handlers work
import { handlers } from './auth'

console.log('Testing NextAuth v5 handlers...')
console.log('Handlers object:', typeof handlers)
console.log('GET handler:', typeof handlers.GET)
console.log('POST handler:', typeof handlers.POST)

if (handlers && typeof handlers.GET === 'function' && typeof handlers.POST === 'function') {
  console.log('✅ SUCCESS: NextAuth v5 handlers are working!')
} else {
  console.log('❌ FAIL: Handlers not working')
}