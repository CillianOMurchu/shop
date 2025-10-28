class Api::V1::EntitiesController < ApplicationController
  before_action :set_entity_type
  before_action :set_entity, only: [:show, :update, :destroy]

  # GET /api/v1/:entity_type
  def index
    @entities = Entity.of_type(@entity_type)
                     .includes(:outgoing_relationships)
                     .page(params[:page])
                     .per(params[:per_page] || 20)

    # Apply search if provided
    @entities = @entities.search(params[:search]) if params[:search].present?

    render json: {
      data: @entities.map(&:full_data),
      meta: {
        current_page: @entities.current_page,
        total_pages: @entities.total_pages,
        total_count: @entities.total_count,
        per_page: @entities.limit_value
      }
    }
  end

  # GET /api/v1/:entity_type/:id
  def show
    render json: { data: @entity.full_data }
  end

  # POST /api/v1/:entity_type
  def create
    @entity = Entity.new(entity_params.merge(entity_type: @entity_type))

    if @entity.save
      render json: { data: @entity.full_data }, status: :created
    else
      render json: { errors: @entity.errors }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/:entity_type/:id
  def update
    if @entity.update(entity_params)
      render json: { data: @entity.full_data }
    else
      render json: { errors: @entity.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/:entity_type/:id
  def destroy
    @entity.destroy
    head :no_content
  end

  private

  def set_entity_type
    @entity_type = params[:entity_type] || controller_name.singularize
  end

  def set_entity
    @entity = Entity.of_type(@entity_type).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "#{@entity_type.capitalize} not found" }, status: :not_found
  end

  def entity_params
    # Get the schema for this entity type to determine allowed fields
    schema = Schema.find_by(name: @entity_type.downcase)
    
    if schema&.fields.present?
      # Dynamic parameter filtering based on schema
      permitted_fields = schema.fields.map { |field| field['name'].to_sym }
      base_params = [:name] + permitted_fields
      
      # Handle nested data structure
      data_params = params.require(@entity_type.singularize.to_sym).permit(base_params)
      
      # Extract name and organize the rest as data
      {
        name: data_params[:name],
        data: data_params.except(:name)
      }
    else
      # Fallback to basic params if no schema exists
      params.require(@entity_type.singularize.to_sym).permit(:name, data: {})
    end
  end
end