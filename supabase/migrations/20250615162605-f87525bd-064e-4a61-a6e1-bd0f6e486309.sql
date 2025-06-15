
-- Add new columns to the clients table for additional details
ALTER TABLE public.clients
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT,
ADD COLUMN status TEXT,
ADD COLUMN region TEXT,
ADD COLUMN avatar_initials VARCHAR(2),
ADD COLUMN registered_on DATE;

-- Add a UNIQUE constraint on email
ALTER TABLE public.clients ADD CONSTRAINT clients_email_key UNIQUE (email);

-- Add some mock data to the clients table for the current branch to test with
-- The branch ID is taken from the current URL
INSERT INTO public.clients (branch_id, first_name, last_name, email, phone, address, status, region, avatar_initials, registered_on)
VALUES
('9c5613f3-2c87-4492-820d-143f634023bb', 'Wendy', 'Smith', 'wendysmith@gmail.com', '+44 20 7946 0587', 'Milton Keynes, MK9 3NZ', 'Active', 'North', 'WS', '2023-02-15'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'John', 'Michael', 'john.michael@hotmail.com', '+44 20 7946 1122', 'London, SW1A 1AA', 'New Enquiries', 'South', 'JM', '2023-05-22'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'Lisa', 'Rodrigues', 'lisa.rod@outlook.com', '+44 20 7946 3344', 'Cambridge, CB2 1TN', 'Actively Assessing', 'East', 'LR', '2023-08-10'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'Kate', 'Williams', 'kate.w@company.co.uk', '+44 20 7946 5566', 'Bristol, BS1 5TR', 'Closed Enquiries', 'West', 'KW', '2022-11-05'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'Robert', 'Johnson', 'r.johnson@gmail.com', '+44 20 7946 7788', 'Manchester, M1 1AE', 'Former', 'North', 'RJ', '2022-09-18'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'Emma', 'Thompson', 'emma.t@gmail.com', '+44 20 7946 9900', 'Southampton, SO14 2AR', 'New Enquiries', 'South', 'ET', '2023-03-29'),
('9c5613f3-2c87-4492-820d-143f634023bb', 'David', 'Wilson', 'd.wilson@company.org', '+44 20 7946 1234', 'Norwich, NR1 3QU', 'Active', 'East', 'DW', '2023-07-13');

-- Add indexes for columns that will be used for filtering
CREATE INDEX IF NOT EXISTS idx_clients_branch_id ON public.clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_region ON public.clients(region);
