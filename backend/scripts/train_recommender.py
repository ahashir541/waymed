"""Train the synthetic department baseline and report held-out demo metrics."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.recommender import train_and_evaluate


def main() -> None:
    with SessionLocal() as session:
        results = train_and_evaluate(session)

    print("Synthetic-data baseline evaluation (not a medical tool)")
    print(f"Training examples: {results['training_examples']}")
    print(f"Test examples: {results['test_examples']}")
    print(f"Top-1 accuracy: {results['top_1_accuracy']:.3f}")
    print(f"Top-3 accuracy: {results['top_3_accuracy']:.3f}")
    print("Per-department recall:")
    for department, metrics in sorted(results["per_department_recall"].items()):
        if isinstance(metrics, dict) and "recall" in metrics:
            print(f"  {department}: {metrics['recall']:.3f}")
    print(f"Saved model: {results['artifact_path']}")
    print(f"Notice: {results['data_notice']}")


if __name__ == "__main__":
    main()
