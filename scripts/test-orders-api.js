// Simple test script to verify orders API
// Run with: node scripts/test-orders-api.js

const BASE_URL = 'http://localhost:3000'

async function testOrdersAPI() {
  console.log('🧪 Testing Orders API...\n')

  try {
    // Test 1: Get all orders
    console.log('1. Testing GET /api/admin/orders')
    const response1 = await fetch(`${BASE_URL}/api/admin/orders`)
    const result1 = await response1.json()
    console.log('Status:', response1.status)
    console.log('Response:', JSON.stringify(result1, null, 2))
    console.log('✅ Test 1 passed\n')

    // Test 2: Get orders with status filter
    console.log('2. Testing GET /api/admin/orders?status=pending')
    const response2 = await fetch(`${BASE_URL}/api/admin/orders?status=pending`)
    const result2 = await response2.json()
    console.log('Status:', response2.status)
    console.log('Response:', JSON.stringify(result2, null, 2))
    console.log('✅ Test 2 passed\n')

    // Test 3: Get orders with search
    console.log('3. Testing GET /api/admin/orders?search=Budi')
    const response3 = await fetch(`${BASE_URL}/api/admin/orders?search=Budi`)
    const result3 = await response3.json()
    console.log('Status:', response3.status)
    console.log('Response:', JSON.stringify(result3, null, 2))
    console.log('✅ Test 3 passed\n')

    // Test 4: Get order detail (assuming order ID 1 exists)
    if (result1.success && result1.data.orders.length > 0) {
      const orderId = result1.data.orders[0].id
      console.log(`4. Testing GET /api/admin/orders/${orderId}`)
      const response4 = await fetch(`${BASE_URL}/api/admin/orders/${orderId}`)
      const result4 = await response4.json()
      console.log('Status:', response4.status)
      console.log('Response:', JSON.stringify(result4, null, 2))
      console.log('✅ Test 4 passed\n')
    }

    console.log('🎉 All tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
testOrdersAPI()
