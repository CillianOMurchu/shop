class CreateEntityRelationships < ActiveRecord::Migration[7.1]
  def change
    create_table :entity_relationships, id: :string do |t|
      t.string :from_entity_id, null: false
      t.string :to_entity_id, null: false
      t.string :relationship_type, null: false

      t.timestamps
    end
    
    add_foreign_key :entity_relationships, :entities, column: :from_entity_id
    add_foreign_key :entity_relationships, :entities, column: :to_entity_id
    add_index :entity_relationships, [:from_entity_id, :relationship_type]
    add_index :entity_relationships, [:to_entity_id, :relationship_type]
  end
end
