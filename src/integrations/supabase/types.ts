export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_login_attempts: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          location_data: Json | null
          step: string
          success: boolean
          user_agent: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          step: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          step?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          acted_at: string | null
          action_label: string | null
          action_url: string | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          dismissed_reason: string | null
          expected_impact: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          outcome_notes: string | null
          outcome_recorded: boolean | null
          outcome_success: boolean | null
          priority: Database["public"]["Enums"]["suggestion_priority"] | null
          reasoning: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          target_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          acted_at?: string | null
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expected_impact?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          outcome_notes?: string | null
          outcome_recorded?: boolean | null
          outcome_success?: boolean | null
          priority?: Database["public"]["Enums"]["suggestion_priority"] | null
          reasoning?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          target_id?: string | null
          target_type: string
          title: string
        }
        Update: {
          acted_at?: string | null
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expected_impact?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          outcome_notes?: string | null
          outcome_recorded?: boolean | null
          outcome_success?: boolean | null
          priority?: Database["public"]["Enums"]["suggestion_priority"] | null
          reasoning?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_type?: Database["public"]["Enums"]["suggestion_type"]
          target_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      availability_status: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      body_types: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      car_categories: {
        Row: {
          badge_color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          badge_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          badge_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      car_enquiries: {
        Row: {
          car_listing_id: string
          contacted_at: string | null
          converted_at: string | null
          created_at: string | null
          dealer_id: string
          dealer_notes: string | null
          enquiry_source: string | null
          enquiry_type: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          ip_address: string | null
          notes: string | null
          priority: string | null
          referrer_url: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          car_listing_id: string
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          dealer_id: string
          dealer_notes?: string | null
          enquiry_source?: string | null
          enquiry_type: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          priority?: string | null
          referrer_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          car_listing_id?: string
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          dealer_id?: string
          dealer_notes?: string | null
          enquiry_source?: string | null
          enquiry_type?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          priority?: string | null
          referrer_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_enquiries_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_enquiries_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_enquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_listing_features: {
        Row: {
          car_listing_id: string
          created_at: string | null
          feature_id: string
          id: string
        }
        Insert: {
          car_listing_id: string
          created_at?: string | null
          feature_id: string
          id?: string
        }
        Update: {
          car_listing_id?: string
          created_at?: string | null
          feature_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_listing_features_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listing_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      car_listings: {
        Row: {
          admin_notes: string | null
          alternate_phone: string | null
          body_type_id: string | null
          brand_id: string | null
          call_verified: boolean | null
          call_verified_at: string | null
          call_verified_by: string | null
          car_condition: Database["public"]["Enums"]["car_condition"]
          category_id: string | null
          city_id: string | null
          color: string
          created_at: string | null
          description: string | null
          enquiry_count: number | null
          expected_price: number
          featured_until: string | null
          fuel_type_id: string | null
          full_address: string | null
          has_loan: boolean | null
          highlights: string[] | null
          id: string
          insurance_status: string | null
          insurance_url: string | null
          insurance_validity: string | null
          is_featured: boolean | null
          kms_driven: number
          listing_id: string | null
          loan_papers_url: string | null
          model_id: string | null
          owner_type_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          photos: Json
          price_type: Database["public"]["Enums"]["price_type"] | null
          primary_phone: string | null
          published_at: string | null
          rc_book_url: string | null
          registration_number: string | null
          rejection_reason: string | null
          seats: number | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          transmission_id: string | null
          updated_at: string | null
          variant: string
          view_count: number | null
          year_of_make: number
          year_of_purchase: number | null
        }
        Insert: {
          admin_notes?: string | null
          alternate_phone?: string | null
          body_type_id?: string | null
          brand_id?: string | null
          call_verified?: boolean | null
          call_verified_at?: string | null
          call_verified_by?: string | null
          car_condition: Database["public"]["Enums"]["car_condition"]
          category_id?: string | null
          city_id?: string | null
          color: string
          created_at?: string | null
          description?: string | null
          enquiry_count?: number | null
          expected_price: number
          featured_until?: string | null
          fuel_type_id?: string | null
          full_address?: string | null
          has_loan?: boolean | null
          highlights?: string[] | null
          id?: string
          insurance_status?: string | null
          insurance_url?: string | null
          insurance_validity?: string | null
          is_featured?: boolean | null
          kms_driven: number
          listing_id?: string | null
          loan_papers_url?: string | null
          model_id?: string | null
          owner_type_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          photos?: Json
          price_type?: Database["public"]["Enums"]["price_type"] | null
          primary_phone?: string | null
          published_at?: string | null
          rc_book_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          seats?: number | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission_id?: string | null
          updated_at?: string | null
          variant: string
          view_count?: number | null
          year_of_make: number
          year_of_purchase?: number | null
        }
        Update: {
          admin_notes?: string | null
          alternate_phone?: string | null
          body_type_id?: string | null
          brand_id?: string | null
          call_verified?: boolean | null
          call_verified_at?: string | null
          call_verified_by?: string | null
          car_condition?: Database["public"]["Enums"]["car_condition"]
          category_id?: string | null
          city_id?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          enquiry_count?: number | null
          expected_price?: number
          featured_until?: string | null
          fuel_type_id?: string | null
          full_address?: string | null
          has_loan?: boolean | null
          highlights?: string[] | null
          id?: string
          insurance_status?: string | null
          insurance_url?: string | null
          insurance_validity?: string | null
          is_featured?: boolean | null
          kms_driven?: number
          listing_id?: string | null
          loan_papers_url?: string | null
          model_id?: string | null
          owner_type_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          photos?: Json
          price_type?: Database["public"]["Enums"]["price_type"] | null
          primary_phone?: string | null
          published_at?: string | null
          rc_book_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          seats?: number | null
          seller_id?: string
          seller_type?: Database["public"]["Enums"]["seller_type"]
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission_id?: string | null
          updated_at?: string | null
          variant?: string
          view_count?: number | null
          year_of_make?: number
          year_of_purchase?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_body_type_id_fkey"
            columns: ["body_type_id"]
            isOneToOne: false
            referencedRelation: "body_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_call_verified_by_fkey"
            columns: ["call_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "car_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_fuel_type_id_fkey"
            columns: ["fuel_type_id"]
            isOneToOne: false
            referencedRelation: "fuel_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_owner_type_id_fkey"
            columns: ["owner_type_id"]
            isOneToOne: false
            referencedRelation: "owner_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_listings_transmission_id_fkey"
            columns: ["transmission_id"]
            isOneToOne: false
            referencedRelation: "transmissions"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_funnel: {
        Row: {
          car_listing_id: string | null
          conversion_probability: number | null
          created_at: string | null
          dealer_id: string | null
          drop_off_reason: string | null
          dropped_off: boolean | null
          duration_seconds: number | null
          entered_at: string | null
          estimated_time_to_convert: number | null
          exited_at: string | null
          id: string
          metadata: Json | null
          next_best_action: string | null
          next_stage: Database["public"]["Enums"]["funnel_stage"] | null
          previous_stage: Database["public"]["Enums"]["funnel_stage"] | null
          session_id: string
          stage: Database["public"]["Enums"]["funnel_stage"]
          user_id: string | null
        }
        Insert: {
          car_listing_id?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          dealer_id?: string | null
          drop_off_reason?: string | null
          dropped_off?: boolean | null
          duration_seconds?: number | null
          entered_at?: string | null
          estimated_time_to_convert?: number | null
          exited_at?: string | null
          id?: string
          metadata?: Json | null
          next_best_action?: string | null
          next_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          previous_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          session_id: string
          stage: Database["public"]["Enums"]["funnel_stage"]
          user_id?: string | null
        }
        Update: {
          car_listing_id?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          dealer_id?: string | null
          drop_off_reason?: string | null
          dropped_off?: boolean | null
          duration_seconds?: number | null
          entered_at?: string | null
          estimated_time_to_convert?: number | null
          exited_at?: string | null
          id?: string
          metadata?: Json | null
          next_best_action?: string | null
          next_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          previous_stage?: Database["public"]["Enums"]["funnel_stage"] | null
          session_id?: string
          stage?: Database["public"]["Enums"]["funnel_stage"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_funnel_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_applications: {
        Row: {
          address: string
          admin_notes: string | null
          alternate_phone: string | null
          business_type: string | null
          city_id: string | null
          created_at: string | null
          dealer_agreement_url: string | null
          dealer_id: string | null
          dealership_name: string
          email: string
          gst_certificate_url: string | null
          gst_number: string | null
          id: string
          is_phone_verified: boolean | null
          owner_aadhar_number: string | null
          owner_aadhar_url: string | null
          owner_name: string
          pan_card_url: string | null
          pan_number: string | null
          phone_number: string
          phone_verified_at: string | null
          pincode: string
          rejection_reason: string | null
          requested_plan_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_registration_url: string | null
          state: string
          status: string
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
          year_established: number | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          alternate_phone?: string | null
          business_type?: string | null
          city_id?: string | null
          created_at?: string | null
          dealer_agreement_url?: string | null
          dealer_id?: string | null
          dealership_name: string
          email: string
          gst_certificate_url?: string | null
          gst_number?: string | null
          id?: string
          is_phone_verified?: boolean | null
          owner_aadhar_number?: string | null
          owner_aadhar_url?: string | null
          owner_name: string
          pan_card_url?: string | null
          pan_number?: string | null
          phone_number: string
          phone_verified_at?: string | null
          pincode: string
          rejection_reason?: string | null
          requested_plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_registration_url?: string | null
          state: string
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          year_established?: number | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          alternate_phone?: string | null
          business_type?: string | null
          city_id?: string | null
          created_at?: string | null
          dealer_agreement_url?: string | null
          dealer_id?: string | null
          dealership_name?: string
          email?: string
          gst_certificate_url?: string | null
          gst_number?: string | null
          id?: string
          is_phone_verified?: boolean | null
          owner_aadhar_number?: string | null
          owner_aadhar_url?: string | null
          owner_name?: string
          pan_card_url?: string | null
          pan_number?: string | null
          phone_number?: string
          phone_verified_at?: string | null
          pincode?: string
          rejection_reason?: string | null
          requested_plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_registration_url?: string | null
          state?: string
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_applications_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_applications_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_applications_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_behavior_metrics: {
        Row: {
          avg_response_time_minutes: number | null
          best_response_day: string | null
          best_response_hour: number | null
          conversion_rate: number | null
          created_at: string | null
          customer_satisfaction_score: number | null
          dealer_id: string
          fastest_response_minutes: number | null
          id: string
          last_response_at: string | null
          leads_converted: number | null
          leads_ignored: number | null
          leads_responded: number | null
          period_end: string | null
          period_start: string | null
          quality_score: number | null
          reliability_score: number | null
          response_rate: number | null
          slowest_response_minutes: number | null
          streak_days: number | null
          total_leads_received: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_minutes?: number | null
          best_response_day?: string | null
          best_response_hour?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          dealer_id: string
          fastest_response_minutes?: number | null
          id?: string
          last_response_at?: string | null
          leads_converted?: number | null
          leads_ignored?: number | null
          leads_responded?: number | null
          period_end?: string | null
          period_start?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          response_rate?: number | null
          slowest_response_minutes?: number | null
          streak_days?: number | null
          total_leads_received?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_minutes?: number | null
          best_response_day?: string | null
          best_response_hour?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          dealer_id?: string
          fastest_response_minutes?: number | null
          id?: string
          last_response_at?: string | null
          leads_converted?: number | null
          leads_ignored?: number | null
          leads_responded?: number | null
          period_end?: string | null
          period_start?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          response_rate?: number | null
          slowest_response_minutes?: number | null
          streak_days?: number | null
          total_leads_received?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dealer_performance_metrics: {
        Row: {
          avg_response_time_hours: number | null
          conversion_rate: number | null
          created_at: string | null
          customer_satisfaction_score: number | null
          dealer_id: string
          id: string
          last_calculated_at: string | null
          total_enquiries: number | null
          total_sales: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          dealer_id: string
          id?: string
          last_calculated_at?: string | null
          total_enquiries?: number | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          dealer_id?: string
          id?: string
          last_calculated_at?: string | null
          total_enquiries?: number | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_performance_metrics_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "dealer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_profiles: {
        Row: {
          about_text: string | null
          address: string
          awards: string[] | null
          banner_url: string | null
          business_type: string | null
          certifications: string[] | null
          city_id: string | null
          created_at: string | null
          customer_photos: Json | null
          dealer_agreement_url: string | null
          dealership_name: string
          facebook_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          gst_certificate_url: string | null
          gst_number: string | null
          id: string
          instagram_url: string | null
          is_documents_verified: boolean | null
          logo_url: string | null
          operating_hours: Json | null
          owner_aadhar_url: string | null
          pan_card_url: string | null
          pan_number: string | null
          pincode: string
          shop_registration_url: string | null
          show_about: boolean | null
          show_awards: boolean | null
          show_banner: boolean | null
          show_certifications: boolean | null
          show_customer_photos: boolean | null
          show_google_rating: boolean | null
          show_logo: boolean | null
          show_operating_hours: boolean | null
          show_social_media: boolean | null
          specialization: string[] | null
          state: string
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
          year_established: number | null
        }
        Insert: {
          about_text?: string | null
          address: string
          awards?: string[] | null
          banner_url?: string | null
          business_type?: string | null
          certifications?: string[] | null
          city_id?: string | null
          created_at?: string | null
          customer_photos?: Json | null
          dealer_agreement_url?: string | null
          dealership_name: string
          facebook_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          gst_certificate_url?: string | null
          gst_number?: string | null
          id: string
          instagram_url?: string | null
          is_documents_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          owner_aadhar_url?: string | null
          pan_card_url?: string | null
          pan_number?: string | null
          pincode: string
          shop_registration_url?: string | null
          show_about?: boolean | null
          show_awards?: boolean | null
          show_banner?: boolean | null
          show_certifications?: boolean | null
          show_customer_photos?: boolean | null
          show_google_rating?: boolean | null
          show_logo?: boolean | null
          show_operating_hours?: boolean | null
          show_social_media?: boolean | null
          specialization?: string[] | null
          state: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          year_established?: number | null
        }
        Update: {
          about_text?: string | null
          address?: string
          awards?: string[] | null
          banner_url?: string | null
          business_type?: string | null
          certifications?: string[] | null
          city_id?: string | null
          created_at?: string | null
          customer_photos?: Json | null
          dealer_agreement_url?: string | null
          dealership_name?: string
          facebook_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          gst_certificate_url?: string | null
          gst_number?: string | null
          id?: string
          instagram_url?: string | null
          is_documents_verified?: boolean | null
          logo_url?: string | null
          operating_hours?: Json | null
          owner_aadhar_url?: string | null
          pan_card_url?: string | null
          pan_number?: string | null
          pincode?: string
          shop_registration_url?: string | null
          show_about?: boolean | null
          show_awards?: boolean | null
          show_banner?: boolean | null
          show_certifications?: boolean | null
          show_customer_photos?: boolean | null
          show_google_rating?: boolean | null
          show_logo?: boolean | null
          show_operating_hours?: boolean | null
          show_social_media?: boolean | null
          specialization?: string[] | null
          state?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_subscriptions: {
        Row: {
          activated_by: string | null
          activation_notes: string | null
          amount_paid: number | null
          created_at: string | null
          dealer_id: string
          ends_at: string
          featured_ads_used: number | null
          id: string
          listings_used: number | null
          manually_activated: boolean | null
          payment_method: string | null
          plan_id: string
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          starts_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          activated_by?: string | null
          activation_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          dealer_id: string
          ends_at: string
          featured_ads_used?: number | null
          id?: string
          listings_used?: number | null
          manually_activated?: boolean | null
          payment_method?: string | null
          plan_id: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          activated_by?: string | null
          activation_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          dealer_id?: string
          ends_at?: string
          featured_ads_used?: number | null
          id?: string
          listings_used?: number | null
          manually_activated?: boolean | null
          payment_method?: string | null
          plan_id?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscriptions_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscriptions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_gap_notifications: {
        Row: {
          created_at: string | null
          dealer_id: string | null
          demand_gap_id: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
        }
        Insert: {
          created_at?: string | null
          dealer_id?: string | null
          demand_gap_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string | null
          demand_gap_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_gap_notifications_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_gap_notifications_demand_gap_id_fkey"
            columns: ["demand_gap_id"]
            isOneToOne: false
            referencedRelation: "unmet_expectations"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      fuel_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      lead_enrichment: {
        Row: {
          ai_score: number | null
          behavioral_signals: Json | null
          budget_confidence:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          buying_timeline: Database["public"]["Enums"]["buying_timeline"] | null
          car_listing_id: string | null
          competitor_activity: Json | null
          conversion_probability: number | null
          dealer_id: string | null
          engagement_score: number | null
          enriched_at: string | null
          id: string
          intent_level: Database["public"]["Enums"]["intent_level"] | null
          lead_id: string
          opportunities: Json | null
          optimal_contact_time: string | null
          predicted_close_date: string | null
          predicted_deal_value: number | null
          previous_interactions_count: number | null
          recommended_actions: Json | null
          risk_factors: Json | null
          similar_searches_count: number | null
          suggested_messaging: string | null
          time_on_listing_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_score?: number | null
          behavioral_signals?: Json | null
          budget_confidence?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          buying_timeline?:
            | Database["public"]["Enums"]["buying_timeline"]
            | null
          car_listing_id?: string | null
          competitor_activity?: Json | null
          conversion_probability?: number | null
          dealer_id?: string | null
          engagement_score?: number | null
          enriched_at?: string | null
          id?: string
          intent_level?: Database["public"]["Enums"]["intent_level"] | null
          lead_id: string
          opportunities?: Json | null
          optimal_contact_time?: string | null
          predicted_close_date?: string | null
          predicted_deal_value?: number | null
          previous_interactions_count?: number | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          similar_searches_count?: number | null
          suggested_messaging?: string | null
          time_on_listing_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_score?: number | null
          behavioral_signals?: Json | null
          budget_confidence?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          buying_timeline?:
            | Database["public"]["Enums"]["buying_timeline"]
            | null
          car_listing_id?: string | null
          competitor_activity?: Json | null
          conversion_probability?: number | null
          dealer_id?: string | null
          engagement_score?: number | null
          enriched_at?: string | null
          id?: string
          intent_level?: Database["public"]["Enums"]["intent_level"] | null
          lead_id?: string
          opportunities?: Json | null
          optimal_contact_time?: string | null
          predicted_close_date?: string | null
          predicted_deal_value?: number | null
          previous_interactions_count?: number | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          similar_searches_count?: number | null
          suggested_messaging?: string | null
          time_on_listing_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_enrichment_car_listing_id"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_enrichment_dealer_id"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_enrichment_lead_id"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "car_enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_enrichment_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          application_number: string | null
          approved_amount: number | null
          car_brand: string
          car_listing_id: string | null
          car_model: string
          car_price: number
          car_variant: string | null
          city_id: string | null
          created_at: string | null
          email: string | null
          employment_type: string
          existing_loans: boolean | null
          full_name: string
          id: string
          interest_rate: number | null
          ip_address: string | null
          monthly_income: number
          notes: string | null
          phone_number: string
          referrer_url: string | null
          rejection_reason: string | null
          source: string | null
          status: string | null
          tenure_months: number | null
          updated_at: string | null
          upload_token: string | null
          upload_token_expires_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          application_number?: string | null
          approved_amount?: number | null
          car_brand: string
          car_listing_id?: string | null
          car_model: string
          car_price: number
          car_variant?: string | null
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          employment_type: string
          existing_loans?: boolean | null
          full_name: string
          id?: string
          interest_rate?: number | null
          ip_address?: string | null
          monthly_income: number
          notes?: string | null
          phone_number: string
          referrer_url?: string | null
          rejection_reason?: string | null
          source?: string | null
          status?: string | null
          tenure_months?: number | null
          updated_at?: string | null
          upload_token?: string | null
          upload_token_expires_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          application_number?: string | null
          approved_amount?: number | null
          car_brand?: string
          car_listing_id?: string | null
          car_model?: string
          car_price?: number
          car_variant?: string | null
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          employment_type?: string
          existing_loans?: boolean | null
          full_name?: string
          id?: string
          interest_rate?: number | null
          ip_address?: string | null
          monthly_income?: number
          notes?: string | null
          phone_number?: string
          referrer_url?: string | null
          rejection_reason?: string | null
          source?: string | null
          status?: string | null
          tenure_months?: number | null
          updated_at?: string | null
          upload_token?: string | null
          upload_token_expires_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_documents: {
        Row: {
          application_id: string
          document_type: string
          file_path: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          application_id: string
          document_type: string
          file_path: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          application_id?: string
          document_type?: string
          file_path?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      market_signals: {
        Row: {
          affected_dealers: string[] | null
          change_percentage: number | null
          confidence_score: number | null
          created_at: string | null
          detected_at: string | null
          entity_id: string | null
          entity_name: string
          entity_type: string
          expires_at: string | null
          id: string
          metadata: Json | null
          metric_value: number
          previous_value: number | null
          priority: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          time_period: string | null
          trend_direction: Database["public"]["Enums"]["trend_direction"] | null
        }
        Insert: {
          affected_dealers?: string[] | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          entity_id?: string | null
          entity_name: string
          entity_type: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          metric_value: number
          previous_value?: number | null
          priority?: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          time_period?: string | null
          trend_direction?:
            | Database["public"]["Enums"]["trend_direction"]
            | null
        }
        Update: {
          affected_dealers?: string[] | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          entity_id?: string | null
          entity_name?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          metric_value?: number
          previous_value?: number | null
          priority?: number | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          time_period?: string | null
          trend_direction?:
            | Database["public"]["Enums"]["trend_direction"]
            | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          conversation_id: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          message_text: string
          message_type: string | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          conversation_id?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message_text: string
          message_type?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          conversation_id?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message_text?: string
          message_type?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_verified: boolean
          max_attempts: number
          otp_hash: string
          phone_number: string
          purpose: string
          user_agent: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_verified?: boolean
          max_attempts?: number
          otp_hash: string
          phone_number: string
          purpose?: string
          user_agent?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_verified?: boolean
          max_attempts?: number
          otp_hash?: string
          phone_number?: string
          purpose?: string
          user_agent?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      owner_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          dealer_id: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          payment_gateway: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          dealer_id: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          dealer_id?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "dealer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_modules: {
        Row: {
          description: string | null
          display_name: string
          icon: string | null
          id: string
          module_name: string
          parent_module_id: string | null
          route: string | null
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          module_name: string
          parent_module_id?: string | null
          route?: string | null
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          module_name?: string
          parent_module_id?: string | null
          route?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_modules_parent_module_id_fkey"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone_number: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          assigned_by: string | null
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_options: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          seats: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          seats: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          seats?: number
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          failed_login_attempts: number
          id: string
          is_locked: boolean
          last_login_at: string | null
          locked_until: string | null
          must_change_password: boolean
          password_changed_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_login_attempts?: number
          id?: string
          is_locked?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_login_attempts?: number
          id?: string
          is_locked?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          display_name: string
          featured_ads_limit: number
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          listing_limit: number
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_name: string
          featured_ads_limit: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          listing_limit: number
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_name?: string
          featured_ads_limit?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          listing_limit?: number
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_drive_bookings: {
        Row: {
          car_listing_id: string
          confirmed_at: string | null
          created_at: string | null
          dealer_confirmed: boolean | null
          dealer_id: string
          dealer_notes: string | null
          id: string
          notes: string | null
          preferred_date: string
          preferred_time: string | null
          reminder_scheduled_for: string | null
          reminder_sent_at: string | null
          rescheduled_at: string | null
          showroom_address: string
          status: string
          time_slot: string
          updated_at: string | null
          user_id: string
          whatsapp_confirmation_sent: boolean | null
          whatsapp_reminder_sent: boolean | null
        }
        Insert: {
          car_listing_id: string
          confirmed_at?: string | null
          created_at?: string | null
          dealer_confirmed?: boolean | null
          dealer_id: string
          dealer_notes?: string | null
          id?: string
          notes?: string | null
          preferred_date: string
          preferred_time?: string | null
          reminder_scheduled_for?: string | null
          reminder_sent_at?: string | null
          rescheduled_at?: string | null
          showroom_address: string
          status?: string
          time_slot: string
          updated_at?: string | null
          user_id: string
          whatsapp_confirmation_sent?: boolean | null
          whatsapp_reminder_sent?: boolean | null
        }
        Update: {
          car_listing_id?: string
          confirmed_at?: string | null
          created_at?: string | null
          dealer_confirmed?: boolean | null
          dealer_id?: string
          dealer_notes?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string
          preferred_time?: string | null
          reminder_scheduled_for?: string | null
          reminder_sent_at?: string | null
          rescheduled_at?: string | null
          showroom_address?: string
          status?: string
          time_slot?: string
          updated_at?: string | null
          user_id?: string
          whatsapp_confirmation_sent?: boolean | null
          whatsapp_reminder_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drive_bookings_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drive_bookings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drive_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_drive_bookings_backup: {
        Row: {
          cancellation_reason: string | null
          car_listing_id: string | null
          confirmation_sent_at: string | null
          confirmed_at: string | null
          created_at: string | null
          dealer_confirmed: boolean | null
          dealer_id: string | null
          dealer_notes: string | null
          google_maps_link: string | null
          id: string | null
          notes: string | null
          preferred_date: string | null
          preferred_time: string | null
          reminder_scheduled_for: string | null
          reminder_sent_at: string | null
          rescheduled_at: string | null
          rescheduled_from: string | null
          showroom_address: string | null
          showroom_name: string | null
          status: string | null
          time_slot: string | null
          updated_at: string | null
          user_confirmed: boolean | null
          user_id: string | null
          whatsapp_confirmation_sent: boolean | null
          whatsapp_reminder_sent: boolean | null
        }
        Insert: {
          cancellation_reason?: string | null
          car_listing_id?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          dealer_confirmed?: boolean | null
          dealer_id?: string | null
          dealer_notes?: string | null
          google_maps_link?: string | null
          id?: string | null
          notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          reminder_scheduled_for?: string | null
          reminder_sent_at?: string | null
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          showroom_address?: string | null
          showroom_name?: string | null
          status?: string | null
          time_slot?: string | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
          whatsapp_confirmation_sent?: boolean | null
          whatsapp_reminder_sent?: boolean | null
        }
        Update: {
          cancellation_reason?: string | null
          car_listing_id?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          dealer_confirmed?: boolean | null
          dealer_id?: string | null
          dealer_notes?: string | null
          google_maps_link?: string | null
          id?: string | null
          notes?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          reminder_scheduled_for?: string | null
          reminder_sent_at?: string | null
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          showroom_address?: string | null
          showroom_name?: string | null
          status?: string | null
          time_slot?: string | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
          whatsapp_confirmation_sent?: boolean | null
          whatsapp_reminder_sent?: boolean | null
        }
        Relationships: []
      }
      transmissions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      unmet_expectations: {
        Row: {
          admin_notes: string | null
          brand_preference: string[] | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          city_preference: string | null
          conversion_probability: number | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          dealer_assigned_to: string | null
          dealer_responses: Json | null
          dealer_views: Json | null
          first_viewed_at: string | null
          id: string
          kms_max: number | null
          last_viewed_at: string | null
          listing_matches: Json | null
          matched_listing_id: string | null
          model_preference: string[] | null
          must_haves: Json | null
          note: string | null
          preferred_body_types: string[] | null
          preferred_brands: string[] | null
          preferred_colors: string[] | null
          preferred_fuel_types: string[] | null
          priority_score: number | null
          response_count: number | null
          session_id: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          urgency: string | null
          user_id: string | null
          view_count: number | null
          year_max: number | null
          year_min: number | null
        }
        Insert: {
          admin_notes?: string | null
          brand_preference?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          city_preference?: string | null
          conversion_probability?: number | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          dealer_assigned_to?: string | null
          dealer_responses?: Json | null
          dealer_views?: Json | null
          first_viewed_at?: string | null
          id?: string
          kms_max?: number | null
          last_viewed_at?: string | null
          listing_matches?: Json | null
          matched_listing_id?: string | null
          model_preference?: string[] | null
          must_haves?: Json | null
          note?: string | null
          preferred_body_types?: string[] | null
          preferred_brands?: string[] | null
          preferred_colors?: string[] | null
          preferred_fuel_types?: string[] | null
          priority_score?: number | null
          response_count?: number | null
          session_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
          view_count?: number | null
          year_max?: number | null
          year_min?: number | null
        }
        Update: {
          admin_notes?: string | null
          brand_preference?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          city_preference?: string | null
          conversion_probability?: number | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          dealer_assigned_to?: string | null
          dealer_responses?: Json | null
          dealer_views?: Json | null
          first_viewed_at?: string | null
          id?: string
          kms_max?: number | null
          last_viewed_at?: string | null
          listing_matches?: Json | null
          matched_listing_id?: string | null
          model_preference?: string[] | null
          must_haves?: Json | null
          note?: string | null
          preferred_body_types?: string[] | null
          preferred_brands?: string[] | null
          preferred_colors?: string[] | null
          preferred_fuel_types?: string[] | null
          priority_score?: number | null
          response_count?: number | null
          session_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
          view_count?: number | null
          year_max?: number | null
          year_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_unmet_expectations_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmet_expectations_dealer_assigned_to_fkey"
            columns: ["dealer_assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmet_expectations_matched_listing_id_fkey"
            columns: ["matched_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_car_views: {
        Row: {
          car_listing_id: string
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          car_listing_id: string
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          car_listing_id?: string
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_car_views_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_car_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          at: string | null
          car_id: string | null
          event: string
          id: number
          meta: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          at?: string | null
          car_id?: string | null
          event: string
          id?: number
          meta?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          at?: string | null
          car_id?: string | null
          event?: string
          id?: number
          meta?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          assigned_by: string | null
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          body_type_affinity: Json | null
          brand_affinity: Json | null
          budget_band: string | null
          buying_mode: string | null
          city_name: string | null
          country: string | null
          created_at: string | null
          finance_interest: number | null
          intent: string | null
          intent_score: number | null
          last_seen: string | null
          latitude: number | null
          location_updated_at: string | null
          longitude: number | null
          preferred_brands: string[] | null
          price_sensitivity: number | null
          state_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_type_affinity?: Json | null
          brand_affinity?: Json | null
          budget_band?: string | null
          buying_mode?: string | null
          city_name?: string | null
          country?: string | null
          created_at?: string | null
          finance_interest?: number | null
          intent?: string | null
          intent_score?: number | null
          last_seen?: string | null
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          preferred_brands?: string[] | null
          price_sensitivity?: number | null
          state_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_type_affinity?: Json | null
          brand_affinity?: Json | null
          budget_band?: string | null
          buying_mode?: string | null
          city_name?: string | null
          country?: string | null
          created_at?: string | null
          finance_interest?: number | null
          intent?: string | null
          intent_score?: number | null
          last_seen?: string | null
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          preferred_brands?: string[] | null
          price_sensitivity?: number | null
          state_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_cars: {
        Row: {
          car_listing_id: string
          id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          car_listing_id: string
          id?: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          car_listing_id?: string
          id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_cars_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      years: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_dealer_response: {
        Args: { p_demand_gap_id: string; p_response: Json }
        Returns: undefined
      }
      can_dealer_create_listing: {
        Args: { dealer_uuid: string }
        Returns: boolean
      }
      can_manage_dealer_photos: {
        Args: { _dealer_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      create_direct_conversation: {
        Args: { p_title?: string; p_user1_id: string; p_user2_id: string }
        Returns: string
      }
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_available_slots: {
        Args: { p_date: string; p_dealer_id: string }
        Returns: {
          is_available: boolean
          time_slot: string
        }[]
      }
      get_dealer_subscription_info: {
        Args: { dealer_uuid: string }
        Returns: {
          featured_limit: number
          featured_remaining: number
          featured_used: number
          has_active_subscription: boolean
          listing_limit: number
          listings_remaining: number
          listings_used: number
          plan_name: string
          subscription_ends_at: string
        }[]
      }
      get_dealers_list: {
        Args: never
        Returns: {
          avatar_url: string
          city_name: string
          dealership_name: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          logo_url: string
          total_listings: number
          username: string
        }[]
      }
      get_internal_staff: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          username: string
        }[]
      }
      get_loan_application_stats: { Args: never; Returns: Json }
      get_or_create_direct_conversation: {
        Args: { participant_ids: string[] }
        Returns: string
      }
      get_pending_applications_count: { Args: never; Returns: number }
      get_staff_user_id_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      get_unread_demand_gap_count: {
        Args: { p_dealer_id: string }
        Returns: number
      }
      get_unread_message_count: { Args: { p_user_id: string }; Returns: number }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_intelligence: {
        Args: never
        Returns: {
          body_type_affinity: Json
          brand_affinity: Json
          budget_band: string
          buying_mode: string
          cars_compared: number
          cars_shortlisted: number
          cars_viewed: number
          dealer_contacts: number
          engagement_score: number
          first_activity: string
          full_name: string
          intent: string
          intent_score: number
          is_active: boolean
          last_activity: string
          last_seen: string
          loan_checks: number
          phone_number: string
          preferred_brands: string[]
          quiz_completed: boolean
          registered_at: string
          searches_performed: number
          test_drives_requested: number
          total_sessions: number
          unmet_demand_note: string
          unmet_demand_specs: Json
          unmet_demand_submitted_at: string
          unmet_demand_urgency: string
          user_id: string
          username: string
        }[]
      }
      get_user_permissions: {
        Args: never
        Returns: {
          is_admin: boolean
          is_dealer: boolean
          is_powerdesk: boolean
          is_user: boolean
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_module_permission: {
        Args: {
          _module_name: string
          _permission_type: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_intent_score: {
        Args: { p_event: string; p_user_id: string }
        Returns: undefined
      }
      is_admin_or_powerdesk: { Args: { _user_id: string }; Returns: boolean }
      is_slot_available: {
        Args: { p_date: string; p_dealer_id: string; p_time_slot: string }
        Returns: boolean
      }
      is_staff_account_locked: { Args: { p_user_id: string }; Returns: boolean }
      log_admin_login_attempt: {
        Args: {
          p_failure_reason?: string
          p_ip_address?: string
          p_step: string
          p_success: boolean
          p_user_agent?: string
          p_user_id: string
          p_username: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          _action: string
          _details?: string
          _resource_id?: string
          _resource_type?: string
        }
        Returns: string
      }
      mark_conversation_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      record_failed_staff_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      record_successful_staff_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      staff_username_exists: { Args: { p_username: string }; Returns: boolean }
      track_dealer_view: {
        Args: {
          p_dealer_id: string
          p_dealer_name: string
          p_demand_gap_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "powerdesk"
        | "website_manager"
        | "dealer"
        | "sales"
        | "finance"
        | "inspection"
        | "user"
        | "admin"
      buying_timeline:
        | "immediate"
        | "1-2_weeks"
        | "1_month"
        | "3_months"
        | "exploring"
      car_condition: "excellent" | "good" | "fair" | "needs_work"
      confidence_level: "high" | "medium" | "low"
      funnel_stage:
        | "view"
        | "engage"
        | "favorite"
        | "emi_calculation"
        | "share"
        | "contact_reveal"
        | "call_click"
        | "whatsapp_click"
        | "test_drive_request"
        | "negotiation"
        | "documentation"
        | "closed_won"
        | "closed_lost"
      intent_level: "hot" | "warm" | "cold" | "frozen"
      listing_status:
        | "pending_verification"
        | "verified"
        | "live"
        | "rejected"
        | "sold"
        | "expired"
      payment_status: "pending" | "paid" | "failed"
      price_type: "fixed" | "negotiable"
      seller_type: "individual" | "dealer"
      signal_type:
        | "trending_brand"
        | "trending_model"
        | "hot_location"
        | "demand_spike"
        | "price_opportunity"
        | "inventory_gap"
        | "seasonal_trend"
        | "competitor_activity"
        | "user_behavior_shift"
      suggestion_priority: "critical" | "high" | "medium" | "low"
      suggestion_status:
        | "pending"
        | "acted"
        | "dismissed"
        | "expired"
        | "auto_resolved"
      suggestion_type:
        | "follow_up_lead"
        | "price_adjustment"
        | "inventory_opportunity"
        | "competitor_alert"
        | "engagement_strategy"
        | "timing_optimization"
        | "cross_sell"
        | "retention_risk"
        | "quick_win"
      trend_direction: "up" | "down" | "stable" | "volatile"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "powerdesk",
        "website_manager",
        "dealer",
        "sales",
        "finance",
        "inspection",
        "user",
        "admin",
      ],
      buying_timeline: [
        "immediate",
        "1-2_weeks",
        "1_month",
        "3_months",
        "exploring",
      ],
      car_condition: ["excellent", "good", "fair", "needs_work"],
      confidence_level: ["high", "medium", "low"],
      funnel_stage: [
        "view",
        "engage",
        "favorite",
        "emi_calculation",
        "share",
        "contact_reveal",
        "call_click",
        "whatsapp_click",
        "test_drive_request",
        "negotiation",
        "documentation",
        "closed_won",
        "closed_lost",
      ],
      intent_level: ["hot", "warm", "cold", "frozen"],
      listing_status: [
        "pending_verification",
        "verified",
        "live",
        "rejected",
        "sold",
        "expired",
      ],
      payment_status: ["pending", "paid", "failed"],
      price_type: ["fixed", "negotiable"],
      seller_type: ["individual", "dealer"],
      signal_type: [
        "trending_brand",
        "trending_model",
        "hot_location",
        "demand_spike",
        "price_opportunity",
        "inventory_gap",
        "seasonal_trend",
        "competitor_activity",
        "user_behavior_shift",
      ],
      suggestion_priority: ["critical", "high", "medium", "low"],
      suggestion_status: [
        "pending",
        "acted",
        "dismissed",
        "expired",
        "auto_resolved",
      ],
      suggestion_type: [
        "follow_up_lead",
        "price_adjustment",
        "inventory_opportunity",
        "competitor_alert",
        "engagement_strategy",
        "timing_optimization",
        "cross_sell",
        "retention_risk",
        "quick_win",
      ],
      trend_direction: ["up", "down", "stable", "volatile"],
    },
  },
} as const
