# Create default schemas for our generic CRUD system

# Product schema
product_schema = Schema.create!(
  name: 'product',
  fields: [
    { name: 'name', type: 'string', required: true, label: 'Product Name' },
    { name: 'description', type: 'text', required: false, label: 'Description' },
    { name: 'price', type: 'number', required: true, label: 'Price' },
    { name: 'image', type: 'image', required: false, label: 'Product Image' },
    { name: 'gallery', type: 'image_gallery', required: false, label: 'Image Gallery' },
    { name: 'active', type: 'boolean', required: false, label: 'Active', default: true }
  ],
  relationships: [
    { name: 'category', type: 'belongsTo', target: 'category', label: 'Category' },
    { name: 'tags', type: 'hasMany', target: 'tag', label: 'Tags' }
  ]
)

# Category schema
category_schema = Schema.create!(
  name: 'category',
  fields: [
    { name: 'name', type: 'string', required: true, label: 'Category Name' },
    { name: 'description', type: 'text', required: false, label: 'Description' },
    { name: 'image', type: 'image', required: false, label: 'Category Image' },
    { name: 'active', type: 'boolean', required: false, label: 'Active', default: true }
  ],
  relationships: [
    { name: 'parent', type: 'belongsTo', target: 'category', label: 'Parent Category' },
    { name: 'products', type: 'hasMany', target: 'product', label: 'Products' }
  ]
)

# Tag schema
tag_schema = Schema.create!(
  name: 'tag',
  fields: [
    { name: 'name', type: 'string', required: true, label: 'Tag Name' },
    { name: 'color', type: 'string', required: false, label: 'Color' }
  ],
  relationships: [
    { name: 'products', type: 'hasMany', target: 'product', label: 'Products' }
  ]
)

puts "Created schemas:"
puts "- Product schema: #{product_schema.id}"
puts "- Category schema: #{category_schema.id}"
puts "- Tag schema: #{tag_schema.id}"

# Create some sample data
electronics = Entity.create!(
  entity_type: 'category',
  name: 'Electronics',
  data: {
    description: 'Electronic devices and accessories',
    active: true
  }
)

laptops = Entity.create!(
  entity_type: 'category',
  name: 'Laptops',
  data: {
    description: 'Portable computers',
    active: true
  }
)

# Create parent-child relationship
laptops.add_relationship(electronics, 'parent')

# Create some tags
tech_tag = Entity.create!(
  entity_type: 'tag',
  name: 'Technology',
  data: { color: '#007bff' }
)

popular_tag = Entity.create!(
  entity_type: 'tag',
  name: 'Popular',
  data: { color: '#28a745' }
)

# Create a sample product
macbook = Entity.create!(
  entity_type: 'product',
  name: 'MacBook Pro 14"',
  data: {
    description: 'Powerful laptop for professionals',
    price: 1999.99,
    active: true
  }
)

# Create relationships
macbook.add_relationship(laptops, 'category')
macbook.add_relationship(tech_tag, 'tags')
macbook.add_relationship(popular_tag, 'tags')

puts "\nCreated sample data:"
puts "- Categories: Electronics, Laptops"
puts "- Tags: Technology, Popular"
puts "- Product: MacBook Pro 14\""
puts "- Relationships established"

puts "\nRails API is ready! 🚀"
puts "Run 'rails server -p 3001' to start the backend"
