from datetime import datetime

class CooldownManager:
    def __init__(self):
        self.cooldown_tracker = {}

    def can_give_plus_two(self, sender, cooldown_period):
        current_time = datetime.now()
        sender = sender.lower()

        # Initialize cooldown tracker for sender if not present
        if sender not in self.cooldown_tracker:
            self.cooldown_tracker[sender] = {}

        # Check global cooldown
        if 'global' in self.cooldown_tracker[sender]:
            if current_time - self.cooldown_tracker[sender]['global'] < cooldown_period:
                return False

        # Update global cooldown to the current time
        self.cooldown_tracker[sender]['global'] = current_time
        return True

    def get_cooldown_time(self, sender):
        # Get remaining cooldown time
        return self.cooldown_tracker[sender]['global'] if sender in self.cooldown_tracker else None