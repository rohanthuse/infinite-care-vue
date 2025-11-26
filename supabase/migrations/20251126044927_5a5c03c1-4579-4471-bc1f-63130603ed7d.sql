-- Clean up branch names by trimming whitespace
UPDATE branches 
SET name = TRIM(name) 
WHERE name != TRIM(name);