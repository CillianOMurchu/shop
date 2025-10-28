Rails.application.routes.draw do
  # Health check
  get '/health', to: proc { [200, {}, ['OK']] }

  namespace :api do
    namespace :v1 do
      # Schema management
      resources :schemas do
        member do
          post 'fields', to: 'schemas#add_field'
          delete 'fields/:field_name', to: 'schemas#remove_field'
        end
      end
      
      # Dynamic routes for any entity type
      scope '/:entity_type' do
        get '/', to: 'entities#index'
        post '/', to: 'entities#create'
        get '/:id', to: 'entities#show'
        patch '/:id', to: 'entities#update'
        put '/:id', to: 'entities#update'
        delete '/:id', to: 'entities#destroy'
        
        # Relationship routes
        scope '/:id/relationships' do
          get '/', to: 'relationships#index'
          post '/', to: 'relationships#create'
          delete '/:relationship_type', to: 'relationships#destroy'
        end
      end
    end
  end
end
