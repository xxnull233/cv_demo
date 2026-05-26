import json

with open("src/storage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Check if favorites functions exist
checks = [
    "loadFavorites", "saveFavorites", "addFavorite", "removeFavorite",
    "isFavorited", "createFavoriteFolder", "deleteFavoriteFolder",
    "getFavoriteFolders"
]
for c in checks:
    if c in content:
        print(f"  OK: {c}")
    else:
        print(f"  MISSING: {c}")

print("storage.js check complete")
