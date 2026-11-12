CREATE TABLE communication_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(180) NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  command_level varchar(24) NOT NULL,
  state_scope varchar(100),
  district_scope varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_communication_rooms_state_scope ON communication_rooms (state_scope);
CREATE INDEX ix_communication_rooms_district_scope ON communication_rooms (district_scope);
CREATE TABLE communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES communication_rooms(id) ON DELETE CASCADE,
  sender_user_id varchar(255) NOT NULL,
  sender_name varchar(180) NOT NULL,
  sender_role varchar(40) NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_communication_messages_room_id ON communication_messages (room_id);
CREATE INDEX ix_communication_messages_sender_user_id ON communication_messages (sender_user_id);
CREATE INDEX ix_communication_messages_created_at ON communication_messages (created_at);
INSERT INTO communication_rooms (code, name, command_level)
VALUES ('national-command', 'National Command', 'national')
ON CONFLICT (code) DO NOTHING;
