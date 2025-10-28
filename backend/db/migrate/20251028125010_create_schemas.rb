class CreateSchemas < ActiveRecord::Migration[7.1]
  def change
    create_table :schemas, id: :string do |t|
      t.string :name, null: false
      t.text :fields      # Will store JSON array of field definitions
      t.text :relationships  # Will store JSON array of relationship definitions

      t.timestamps
    end
    
    add_index :schemas, :name, unique: true
  end
end
