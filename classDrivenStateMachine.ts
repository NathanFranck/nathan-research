/**
 * Special order rules, don't break them!
 *      Can always call `log`.
 *      Once `complexComputation` is called at least once then `gatherResult` can be called.
 *      Only once `gatherResult`  is called is the `result` ready to be read from the machine.
 */
 export class FancyCalc implements Transitions<States> {
    private constructor() { }
    static create(): Selector<"initialized"> {
        return new FancyCalc();
    }
    log() {
        const { numberOfComputations, calcAggregate, result } = this;
        console.table({ numberOfComputations, calcAggregate, result });
        return this;
    }
    complexComputation(input: number) {
        this.calcAggregate += input; // TODO - actual complex calculation. For now just add numbers together
        this.numberOfComputations++;
        return this;
    }
    gatherResult() {
        this.result = this.calcAggregate;
        return this;
    }
    given<U>(fn: (calc: this, state: { numberOfComputations: number }) => U) {
        const { numberOfComputations } = this;
        const result = fn(this, { numberOfComputations })
        if (this != result as any) throw new Error("Return value of function must be same instance as input");
        return result;
    }
    calcAggregate = 0;
    numberOfComputations = 0;
    result: number;
}

// Declaring which states the machine can change to
type States = "initialized" | "computed" | "gathered";

// Each method able to transition to a different state
interface Transitions<S extends States> {
    log: () => Selector<S>;
    given: <T extends Selector<any>>(fn: (calc: Selector<S>, state: { numberOfComputations: number }) => T) => T;
    complexComputation: (input: number) => Selector<"computed">;
    gatherResult: () => Selector<"gathered">;
    numberOfComputations: number;
    result: number;
}

// "Pick" which methods to expose in Transitions interface for next chain
type Selector<S extends States> = Pick<Transitions<S>,
    "log" | "given" | (
        S extends "gathered"
        ? "result" | "numberOfComputations"
        : "complexComputation" | (
            S extends "computed"
            ? "gatherResult"
            : never))>;


// 🏃‍♀️ Examples

// Basic usage
{
    console.log(
        FancyCalc
            .create()
            .complexComputation(9)
            .log()
            .complexComputation(2)
            .log()
            .gatherResult()
            .result
    ); // ✅ Compiles
    
    console.log(
        FancyCalc
            .create()
            .complexComputation(9)
            .log()
            .complexComputation(2)
            .log()
            .result // ❌ Syntax Err! `Property 'result' does not exist on type 'Selector<"computed">'.`
            .gatherResult()
    ); 
    
    console.log(
        FancyCalc
            .create()
            .complexComputation(9)
            .log()
            .log()
            .gatherResult()
            .complexComputation(2) // ❌ Syntax Err! `Property 'complexComputation' does not exist on type 'Selector<"gathered">'.`
            .result 
    ); 
}

// Builder functions
{
    function startWith9() {
        return FancyCalc
            .create()
            .complexComputation(9);
    }

    console.log(
        startWith9()
            .log()
            .complexComputation(2)
            .log()
            .gatherResult()
            .result
    );
}

// Trouble with variables
{
    var calc = FancyCalc // Code smell: Cacheing the machine in a variable
        .create()
        .complexComputation(9);
    calc.gatherResult();
    calc.complexComputation(2); // Uh oh... Things are out of order.
    calc.result; // Why isn't this working?

    calc = calc.gatherResult(); // Why can't I transform the variable type?

    // So we try and be safe...
    var calc2: Selector<"initialized"> | Selector<"computed"> | Selector<"gathered">;
    calc2 = FancyCalc.create();
    calc2 = calc2.complexComputation(2);
    calc2 = calc2.gatherResult(); // We're missing methods still?

    // How are we supposed to do anything with if/else/for/while?
}

// Branching/looping logic
{
    console.log(
        FancyCalc
            .create()
            .log()
            .given(calc => { // Loop
                const randomValue = Math.random() * 10;
                for (let i = 0; i < randomValue; i ++) {
                    calc = calc.complexComputation(1);
                }
                return calc;
            })
            .given((calc, { numberOfComputations }) => // Branch
                numberOfComputations > 5
                    ? calc
                        .complexComputation(40)
                    : calc
                        .complexComputation(9)
                        .log()
                        .complexComputation(2))
            .gatherResult()
            .log()
            .result
    );
}