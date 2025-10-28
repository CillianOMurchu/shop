class EntityRelationship < ApplicationRecord
  # Generate UUID for IDs
  before_create :generate_uuid

  belongs_to :from_entity, class_name: 'Entity'
  belongs_to :to_entity, class_name: 'Entity'

  validates :relationship_type, presence: true
  validates :from_entity_id, uniqueness: { 
    scope: [:to_entity_id, :relationship_type],
    message: "Relationship already exists"
  }

  # Prevent self-relationships for certain types
  validate :prevent_self_relationship

  private

  def generate_uuid
    self.id = SecureRandom.uuid if id.blank?
  end

  def prevent_self_relationship
    if from_entity_id == to_entity_id
      errors.add(:to_entity, "Cannot create relationship to self")
    end
  end
end