class Entity < ApplicationRecord
  # Generate UUID for IDs
  before_create :generate_uuid

  validates :entity_type, presence: true
  validates :name, presence: true

  # Serialize the data field as JSON
  serialize :data, JSON

  # Relationships
  has_many :outgoing_relationships, 
           class_name: 'EntityRelationship', 
           foreign_key: :from_entity_id, 
           dependent: :destroy
           
  has_many :incoming_relationships, 
           class_name: 'EntityRelationship', 
           foreign_key: :to_entity_id, 
           dependent: :destroy

  # Get related entities by relationship type
  def related_entities(relationship_type)
    Entity.joins(:incoming_relationships)
          .where(entity_relationships: { 
            from_entity_id: id, 
            relationship_type: relationship_type 
          })
  end

  # Add a relationship to another entity
  def add_relationship(to_entity, relationship_type)
    EntityRelationship.create!(
      from_entity: self,
      to_entity: to_entity,
      relationship_type: relationship_type
    )
  end

  # Remove a relationship
  def remove_relationship(to_entity, relationship_type)
    EntityRelationship.where(
      from_entity: self,
      to_entity: to_entity,
      relationship_type: relationship_type
    ).destroy_all
  end

  # Get all data including relationships
  def full_data
    base_data = {
      id: id,
      entity_type: entity_type,
      name: name,
      created_at: created_at,
      updated_at: updated_at
    }

    # Add serialized data
    base_data.merge!(data || {})

    # Add relationships
    relationships = {}
    outgoing_relationships.includes(:to_entity).group_by(&:relationship_type).each do |rel_type, rels|
      relationships[rel_type] = rels.map do |rel|
        {
          type: rel.to_entity.entity_type,
          id: rel.to_entity.id,
          name: rel.to_entity.name
        }
      end
    end
    
    base_data[:relationships] = relationships unless relationships.empty?
    base_data
  end

  # Scope by entity type
  scope :of_type, ->(type) { where(entity_type: type) }

  # Search by name or entity type
  scope :search, ->(term) { 
    where("name LIKE ? OR entity_type LIKE ?", "%#{term}%", "%#{term}%") 
  }

  private

  def generate_uuid
    self.id = SecureRandom.uuid if id.blank?
  end
end