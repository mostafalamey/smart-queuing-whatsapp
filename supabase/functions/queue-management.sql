-- This SQL file contains functions for managing the queue in the WhatsApp-based queuing system.

-- Function to create a new ticket
CREATE OR REPLACE FUNCTION create_ticket(customer_id INT, service_id INT)
RETURNS TABLE(ticket_id INT, status TEXT) AS $$
BEGIN
    INSERT INTO tickets (customer_id, service_id, status)
    VALUES (customer_id, service_id, 'pending')
    RETURNING id AS ticket_id, status;
END;
$$ LANGUAGE plpgsql;

-- Function to get available services
CREATE OR REPLACE FUNCTION get_services()
RETURNS TABLE(service_id INT, service_name TEXT) AS $$
BEGIN
    RETURN QUERY SELECT id, name FROM services WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket status
CREATE OR REPLACE FUNCTION update_ticket_status(ticket_id INT, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE tickets SET status = new_status WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get ticket status
CREATE OR REPLACE FUNCTION get_ticket_status(ticket_id INT)
RETURNS TABLE(ticket_id INT, status TEXT) AS $$
BEGIN
    RETURN QUERY SELECT id, status FROM tickets WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql;