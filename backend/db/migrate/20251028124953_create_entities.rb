class CreateEntities < ActiveRecord::Migration[7.1]
  def change
    create_table :entities, id: :string do |t|
      t.string :entity_type, null: false
      t.string :name
      t.text :data  # Will store JSON data for entity attributes

      t.timestamps
    end
    
    add_index :entities, :entity_type
    add_index :entities, [:entity_type, :name]
  end
end
