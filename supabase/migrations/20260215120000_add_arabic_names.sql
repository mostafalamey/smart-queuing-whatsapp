-- Migration: Add Arabic name fields to departments and services
-- File: 20260215120000_add_arabic_names.sql
-- Date: February 15, 2026
-- Purpose: Enable multilingual support (Arabic) for kiosk app

-- Add Arabic name column to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Add Arabic name and description columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add comments for documentation
COMMENT ON COLUMN departments.name_ar IS 'Arabic name for the department (for kiosk multilingual support)';
COMMENT ON COLUMN services.name_ar IS 'Arabic name for the service (for kiosk multilingual support)';
COMMENT ON COLUMN services.description_ar IS 'Arabic description for the service (for kiosk multilingual support)';

-- Create indexes for potential Arabic text searches
CREATE INDEX IF NOT EXISTS idx_departments_name_ar ON departments(name_ar);
CREATE INDEX IF NOT EXISTS idx_services_name_ar ON services(name_ar);
