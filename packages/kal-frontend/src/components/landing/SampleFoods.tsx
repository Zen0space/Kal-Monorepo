import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const sampleFoods = [
  { name: "Grilled Chicken", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
  { name: "White Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g" },
  { name: "Salmon Fillet", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100g" },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: "1 cup" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, serving: "1/2 fruit" },
];

export function SampleFoods() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          title="Explore our nutrition database"
          subtitle="Find accurate nutritional information for hundreds of common foods"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {sampleFoods.map((food, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-dark-surface border border-dark-border hover:border-accent/30 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-content-primary">{food.name}</h3>
                <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                  {food.calories} cal
                </span>
              </div>
              <p className="text-content-muted text-sm mb-3">Per {food.serving}</p>
              
              {/* Macro breakdown */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-content-secondary">P: {food.protein}g</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-content-secondary">C: {food.carbs}g</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-content-secondary">F: {food.fat}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button href="/search" variant="secondary" size="lg">
            Search All Foods →
          </Button>
        </div>
      </Container>
    </section>
  );
}
