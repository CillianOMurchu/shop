class Api::V1::SchemasController < ApplicationController
  before_action :set_schema, only: [:show, :update, :destroy]

  # GET /api/v1/schemas
  def index
    @schemas = Schema.all.order(:name)
    
    schemas_hash = {}
    @schemas.each do |schema|
      schemas_hash[schema.name] = {
        id: schema.id,
        name: schema.name,
        fields: schema.fields || [],
        relationships: schema.relationships || [],
        created_at: schema.created_at,
        updated_at: schema.updated_at
      }
    end

    render json: { schemas: schemas_hash }
  end

  # GET /api/v1/schemas/:id
  def show
    render json: {
      data: {
        id: @schema.id,
        name: @schema.name,
        fields: @schema.fields || [],
        relationships: @schema.relationships || [],
        created_at: @schema.created_at,
        updated_at: @schema.updated_at
      }
    }
  end

  # POST /api/v1/schemas
  def create
    @schema = Schema.new(schema_params)

    if @schema.save
      render json: {
        data: {
          id: @schema.id,
          name: @schema.name,
          fields: @schema.fields || [],
          relationships: @schema.relationships || []
        }
      }, status: :created
    else
      render json: { errors: @schema.errors }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/schemas/:id
  def update
    if @schema.update(schema_params)
      render json: {
        data: {
          id: @schema.id,
          name: @schema.name,
          fields: @schema.fields || [],
          relationships: @schema.relationships || []
        }
      }
    else
      render json: { errors: @schema.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/schemas/:id
  def destroy
    @schema.destroy
    head :no_content
  end

  # POST /api/v1/schemas/:id/fields
  def add_field
    field_definition = field_params
    @schema.add_field(field_definition)

    if @schema.save
      render json: {
        data: {
          id: @schema.id,
          name: @schema.name,
          fields: @schema.fields || [],
          relationships: @schema.relationships || []
        }
      }
    else
      render json: { errors: @schema.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/schemas/:id/fields/:field_name
  def remove_field
    @schema.remove_field(params[:field_name])

    if @schema.save
      render json: {
        data: {
          id: @schema.id,
          name: @schema.name,
          fields: @schema.fields || [],
          relationships: @schema.relationships || []
        }
      }
    else
      render json: { errors: @schema.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_schema
    @schema = Schema.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Schema not found" }, status: :not_found
  end

  def schema_params
    params.require(:schema).permit(:name, fields: [], relationships: [])
  end

  def field_params
    params.require(:field).permit(:name, :type, :label, :required, :default)
  end
end