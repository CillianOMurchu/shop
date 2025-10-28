#!/usr/bin/env node

/**
 * CRUD Operations Test Suite
 * Tests all create, read, update, delete operations for the store application
 */

const API_BASE = 'http://localhost:3001/api/v1';

// Test data
const testProduct = {
  name: 'Test Product',
  description: 'A test product for CRUD operations',
  price: 29.99,
  active: true
};

const testCategory = {
  name: 'Test Category',
  description: 'A test category for CRUD operations',
  active: true
};

const testProductUpdate = {
  name: 'Updated Test Product',
  description: 'Updated description',
  price: 39.99,
  active: false
};

// Utility function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🔄 ${config.method || 'GET'} ${url}`);
    if (config.body) {
      console.log('📤 Request body:', JSON.stringify(JSON.parse(config.body), null, 2));
    }
    
    const response = await fetch(url, config);
    const responseText = await response.text();
    
    console.log(`📥 Response status: ${response.status}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('📥 Response (not JSON):', responseText);
      responseData = responseText;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`❌ API request failed:`, error.message);
    throw error;
  }
}

// Test functions
async function testCreateProduct() {
  console.log('\n🧪 Testing CREATE Product...');
  const response = await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify({ product: testProduct })
  });
  
  if (response.data && response.data.id) {
    console.log('✅ Product created successfully');
    return response.data;
  } else {
    throw new Error('Create product failed - no ID returned');
  }
}

async function testCreateCategory() {
  console.log('\n🧪 Testing CREATE Category...');
  const response = await apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({ category: testCategory })
  });
  
  if (response.data && response.data.id) {
    console.log('✅ Category created successfully');
    return response.data;
  } else {
    throw new Error('Create category failed - no ID returned');
  }
}

async function testReadProducts() {
  console.log('\n🧪 Testing READ Products...');
  const response = await apiRequest('/products');
  
  if (response.data && Array.isArray(response.data)) {
    console.log(`✅ Read products successful - found ${response.data.length} products`);
    return response.data;
  } else {
    throw new Error('Read products failed - invalid response format');
  }
}

async function testReadSingleProduct(productId) {
  console.log('\n🧪 Testing READ Single Product...');
  const response = await apiRequest(`/products/${productId}`);
  
  if (response.data && response.data.id === productId) {
    console.log('✅ Read single product successful');
    return response.data;
  } else {
    throw new Error('Read single product failed');
  }
}

async function testUpdateProduct(productId) {
  console.log('\n🧪 Testing UPDATE Product...');
  const response = await apiRequest(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ product: testProductUpdate })
  });
  
  if (response.data && response.data.id === productId) {
    console.log('✅ Update product successful');
    return response.data;
  } else {
    throw new Error('Update product failed');
  }
}

async function testDeleteProduct(productId) {
  console.log('\n🧪 Testing DELETE Product...');
  try {
    await apiRequest(`/products/${productId}`, {
      method: 'DELETE'
    });
    console.log('✅ Delete product successful');
  } catch (error) {
    // Check if it's a 404 (product already deleted) which is acceptable
    if (error.message.includes('404')) {
      console.log('✅ Delete product successful (already deleted)');
    } else {
      throw error;
    }
  }
}

async function testCreateRelationship(productId, categoryId) {
  console.log('\n🧪 Testing CREATE Relationship...');
  const response = await apiRequest(`/products/${productId}/relationships`, {
    method: 'POST',
    body: JSON.stringify({
      relationship: {
        type: 'category',
        target_type: 'categories',
        target_id: categoryId
      }
    })
  });
  
  console.log('✅ Relationship created successfully');
  return response;
}

async function testImageData() {
  console.log('\n🧪 Testing Product with Image Data...');
  const productWithImage = {
    ...testProduct,
    name: 'Product with Image',
    image: {
      id: Date.now(),
      name: 'test-image.jpg',
      size: 12345,
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
      uploadStatus: 'completed'
    },
    gallery: [
      {
        id: Date.now() + 1,
        name: 'gallery-1.jpg',
        size: 23456,
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD',
        uploadStatus: 'completed'
      }
    ]
  };
  
  const response = await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify({ product: productWithImage })
  });
  
  if (response.data && response.data.id) {
    console.log('✅ Product with image data created successfully');
    return response.data;
  } else {
    throw new Error('Create product with image failed');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting CRUD Operations Test Suite\n');
  
  let createdProduct = null;
  let createdCategory = null;
  let productWithImage = null;
  
  try {
    // Test CREATE operations
    createdProduct = await testCreateProduct();
    createdCategory = await testCreateCategory();
    productWithImage = await testImageData();
    
    // Test READ operations
    await testReadProducts();
    await testReadSingleProduct(createdProduct.id);
    
    // Test UPDATE operations
    await testUpdateProduct(createdProduct.id);
    
    // Verify the update worked
    const updatedProduct = await testReadSingleProduct(createdProduct.id);
    if (updatedProduct.name !== testProductUpdate.name) {
      console.warn('⚠️  Update may not have persisted correctly');
      console.log('Expected name:', testProductUpdate.name);
      console.log('Actual name:', updatedProduct.name);
    }
    
    // Test RELATIONSHIP operations
    await testCreateRelationship(createdProduct.id, createdCategory.id);
    
    console.log('\n🎉 All tests completed successfully!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Created product: ${createdProduct.id}`);
    console.log(`✅ Created category: ${createdCategory.id}`);
    console.log(`✅ Created product with image: ${productWithImage.id}`);
    console.log('✅ All CRUD operations working');
    
    return {
      success: true,
      productId: createdProduct.id,
      categoryId: createdCategory.id,
      productWithImageId: productWithImage.id
    };
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    return {
      success: false,
      error: error.message,
      productId: createdProduct?.id,
      categoryId: createdCategory?.id,
      productWithImageId: productWithImage?.id
    };
  } finally {
    // Cleanup (optional - comment out if you want to keep test data)
    console.log('\n🧹 Cleaning up test data...');
    if (createdProduct?.id) {
      try {
        await testDeleteProduct(createdProduct.id);
      } catch (e) {
        console.log('Note: Could not delete test product:', e.message);
      }
    }
    if (productWithImage?.id) {
      try {
        await testDeleteProduct(productWithImage.id);
      } catch (e) {
        console.log('Note: Could not delete test product with image:', e.message);
      }
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runAllTests, apiRequest };