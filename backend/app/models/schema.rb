class Schema < ApplicationRecord
  # Generate UUID for IDs
  before_create :generate_uuid

  validates :name, presence: true, uniqueness: true

  # Serialize JSON fields
  serialize :fields, JSON
  serialize :relationships, JSON

  # Initialize with empty arrays
  after_initialize :set_defaults

  # Validate JSON structure
  validate :validate_fields_structure
  validate :validate_relationships_structure

  # Get field by name
  def field_by_name(name)
    (fields || []).find { |field| field['name'] == name }
  end

  # Get relationship by name
  def relationship_by_name(name)
    (relationships || []).find { |rel| rel['name'] == name }
  end

  # Add a new field
  def add_field(field_definition)
    self.fields = (fields || []) + [field_definition]
  end

  # Remove a field
  def remove_field(field_name)
    self.fields = (fields || []).reject { |field| field['name'] == field_name }
  end

  # Add a new relationship
  def add_relationship(relationship_definition)
    self.relationships = (relationships || []) + [relationship_definition]
  end

  # Remove a relationship
  def remove_relationship(relationship_name)
    self.relationships = (relationships || []).reject { |rel| rel['name'] == relationship_name }
  end

  # Get all valid field types
  def self.valid_field_types
    %w[string text number boolean date image image_gallery]
  end

  # Get all valid relationship types
  def self.valid_relationship_types
    %w[belongsTo hasMany]
  end

  private

  def generate_uuid
    self.id = SecureRandom.uuid if id.blank?
  end

  def set_defaults
    self.fields ||= []
    self.relationships ||= []
  end

  def validate_fields_structure
    return unless fields.present?

    fields.each_with_index do |field, index|
      unless field.is_a?(Hash) && field['name'].present? && field['type'].present?
        errors.add(:fields, "Field at index #{index} must have 'name' and 'type'")
      end

      unless self.class.valid_field_types.include?(field['type'])
        errors.add(:fields, "Invalid field type '#{field['type']}' at index #{index}")
      end
    end
  end

  def validate_relationships_structure
    return unless relationships.present?

    relationships.each_with_index do |rel, index|
      unless rel.is_a?(Hash) && rel['name'].present? && rel['type'].present? && rel['target'].present?
        errors.add(:relationships, "Relationship at index #{index} must have 'name', 'type', and 'target'")
      end

      unless self.class.valid_relationship_types.include?(rel['type'])
        errors.add(:relationships, "Invalid relationship type '#{rel['type']}' at index #{index}")
      end
    end
  end
end