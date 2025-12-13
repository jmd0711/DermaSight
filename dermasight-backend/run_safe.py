import traceback
import sys

try:
    import dermaSight
except Exception as e:
    print("\n" + "="*60)
    print("❌ SERVER FAILED TO START")
    print("="*60)
    print("\nError:", str(e))
    print("\nFull traceback:")
    traceback.print_exc()
    print("="*60)
    sys.exit(1)