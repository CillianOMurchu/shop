class Api::V1::RelationshipsController < ApplicationController
  before_action :set_from_entity

  # POST /api/v1/:entity_type/:id/relationships
  def create
    relationship_params = params.require(:relationship).permit(:type, :target_type, :target_id)
    
    to_entity = Entity.of_type(relationship_params[:target_type]).find(relationship_params[:target_id])
    
    begin
      @from_entity.add_relationship(to_entity, relationship_params[:type])
      render json: { message: "Relationship created successfully" }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Target entity not found" }, status: :not_found
  end

  # DELETE /api/v1/:entity_type/:id/relationships/:relationship_type
  def destroy
    target_type = params[:target_type]
    target_id = params[:target_id]
    relationship_type = params[:relationship_type]

    to_entity = Entity.of_type(target_type).find(target_id)
    @from_entity.remove_relationship(to_entity, relationship_type)
    
    render json: { message: "Relationship removed successfully" }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Target entity not found" }, status: :not_found
  end

  # GET /api/v1/:entity_type/:id/relationships
  def index
    relationships = {}
    
    @from_entity.outgoing_relationships.includes(:to_entity).group_by(&:relationship_type).each do |rel_type, rels|
      relationships[rel_type] = rels.map do |rel|
        {
          type: rel.to_entity.entity_type,
          id: rel.to_entity.id,
          name: rel.to_entity.name,
          data: rel.to_entity.data
        }
      end
    end

    render json: { data: relationships }
  end

  private

  def set_from_entity
    entity_type = params[:entity_type]
    @from_entity = Entity.of_type(entity_type).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Entity not found" }, status: :not_found
  end
end