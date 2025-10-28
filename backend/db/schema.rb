# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_10_28_125010) do
  create_table "entities", id: :string, force: :cascade do |t|
    t.string "entity_type", null: false
    t.string "name"
    t.text "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["entity_type", "name"], name: "index_entities_on_entity_type_and_name"
    t.index ["entity_type"], name: "index_entities_on_entity_type"
  end

  create_table "entity_relationships", id: :string, force: :cascade do |t|
    t.string "from_entity_id", null: false
    t.string "to_entity_id", null: false
    t.string "relationship_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["from_entity_id", "relationship_type"], name: "idx_on_from_entity_id_relationship_type_4025c478fc"
    t.index ["to_entity_id", "relationship_type"], name: "idx_on_to_entity_id_relationship_type_319e640b25"
  end

  create_table "schemas", id: :string, force: :cascade do |t|
    t.string "name", null: false
    t.text "fields"
    t.text "relationships"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_schemas_on_name", unique: true
  end

  add_foreign_key "entity_relationships", "entities", column: "from_entity_id"
  add_foreign_key "entity_relationships", "entities", column: "to_entity_id"
end
