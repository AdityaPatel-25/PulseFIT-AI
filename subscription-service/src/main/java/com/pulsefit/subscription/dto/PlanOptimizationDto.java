package com.pulsefit.subscription.dto;

public class PlanOptimizationDto {

    private Long memberId;
    private String currentPlanType;
    private double currentMonthlyFee;
    private int monthlyWorkouts;
    private double currentCostPerWorkout;
    private String recommendedPlanType;
    private double recommendedMonthlyFee;
    private double projectedCostPerWorkout;
    private double estimatedAnnualSavings;
    private String rationale;

    public PlanOptimizationDto() {}

    public PlanOptimizationDto(Long memberId, String currentPlanType, double currentMonthlyFee,
                               int monthlyWorkouts, double currentCostPerWorkout,
                               String recommendedPlanType, double recommendedMonthlyFee,
                               double projectedCostPerWorkout, double estimatedAnnualSavings,
                               String rationale) {
        this.memberId = memberId;
        this.currentPlanType = currentPlanType;
        this.currentMonthlyFee = currentMonthlyFee;
        this.monthlyWorkouts = monthlyWorkouts;
        this.currentCostPerWorkout = currentCostPerWorkout;
        this.recommendedPlanType = recommendedPlanType;
        this.recommendedMonthlyFee = recommendedMonthlyFee;
        this.projectedCostPerWorkout = projectedCostPerWorkout;
        this.estimatedAnnualSavings = estimatedAnnualSavings;
        this.rationale = rationale;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getCurrentPlanType() {
        return currentPlanType;
    }

    public void setCurrentPlanType(String currentPlanType) {
        this.currentPlanType = currentPlanType;
    }

    public double getCurrentMonthlyFee() {
        return currentMonthlyFee;
    }

    public void setCurrentMonthlyFee(double currentMonthlyFee) {
        this.currentMonthlyFee = currentMonthlyFee;
    }

    public int getMonthlyWorkouts() {
        return monthlyWorkouts;
    }

    public void setMonthlyWorkouts(int monthlyWorkouts) {
        this.monthlyWorkouts = monthlyWorkouts;
    }

    public double getCurrentCostPerWorkout() {
        return currentCostPerWorkout;
    }

    public void setCurrentCostPerWorkout(double currentCostPerWorkout) {
        this.currentCostPerWorkout = currentCostPerWorkout;
    }

    public String getRecommendedPlanType() {
        return recommendedPlanType;
    }

    public void setRecommendedPlanType(String recommendedPlanType) {
        this.recommendedPlanType = recommendedPlanType;
    }

    public double getRecommendedMonthlyFee() {
        return recommendedMonthlyFee;
    }

    public void setRecommendedMonthlyFee(double recommendedMonthlyFee) {
        this.recommendedMonthlyFee = recommendedMonthlyFee;
    }

    public double getProjectedCostPerWorkout() {
        return projectedCostPerWorkout;
    }

    public void setProjectedCostPerWorkout(double projectedCostPerWorkout) {
        this.projectedCostPerWorkout = projectedCostPerWorkout;
    }

    public double getEstimatedAnnualSavings() {
        return estimatedAnnualSavings;
    }

    public void setEstimatedAnnualSavings(double estimatedAnnualSavings) {
        this.estimatedAnnualSavings = estimatedAnnualSavings;
    }

    public String getRationale() {
        return rationale;
    }

    public void setRationale(String rationale) {
        this.rationale = rationale;
    }
}
