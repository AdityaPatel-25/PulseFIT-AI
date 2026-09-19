package com.pulsefit.member.dto;

import java.util.List;

public class MemberRetentionInsightDto {

    private Long memberId;
    private String memberName;
    private int habitScore; // 0 to 100
    private String churnRisk; // LOW_RISK, MODERATE_RISK, CRITICAL_CHURN_RISK
    private String riskBadgeColor;
    private double weeklyWorkoutAverage;
    private int currentStreakDays;
    private int daysSinceLastWorkout;
    private String primaryFacilityAffinity;
    private List<String> prescriptiveRecommendations;

    public MemberRetentionInsightDto() {}

    public MemberRetentionInsightDto(Long memberId, String memberName, int habitScore,
                                    String churnRisk, String riskBadgeColor,
                                    double weeklyWorkoutAverage, int currentStreakDays,
                                    int daysSinceLastWorkout, String primaryFacilityAffinity,
                                    List<String> prescriptiveRecommendations) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.habitScore = habitScore;
        this.churnRisk = churnRisk;
        this.riskBadgeColor = riskBadgeColor;
        this.weeklyWorkoutAverage = weeklyWorkoutAverage;
        this.currentStreakDays = currentStreakDays;
        this.daysSinceLastWorkout = daysSinceLastWorkout;
        this.primaryFacilityAffinity = primaryFacilityAffinity;
        this.prescriptiveRecommendations = prescriptiveRecommendations;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public int getHabitScore() {
        return habitScore;
    }

    public void setHabitScore(int habitScore) {
        this.habitScore = habitScore;
    }

    public String getChurnRisk() {
        return churnRisk;
    }

    public void setChurnRisk(String churnRisk) {
        this.churnRisk = churnRisk;
    }

    public String getRiskBadgeColor() {
        return riskBadgeColor;
    }

    public void setRiskBadgeColor(String riskBadgeColor) {
        this.riskBadgeColor = riskBadgeColor;
    }

    public double getWeeklyWorkoutAverage() {
        return weeklyWorkoutAverage;
    }

    public void setWeeklyWorkoutAverage(double weeklyWorkoutAverage) {
        this.weeklyWorkoutAverage = weeklyWorkoutAverage;
    }

    public int getCurrentStreakDays() {
        return currentStreakDays;
    }

    public void setCurrentStreakDays(int currentStreakDays) {
        this.currentStreakDays = currentStreakDays;
    }

    public int getDaysSinceLastWorkout() {
        return daysSinceLastWorkout;
    }

    public void setDaysSinceLastWorkout(int daysSinceLastWorkout) {
        this.daysSinceLastWorkout = daysSinceLastWorkout;
    }

    public String getPrimaryFacilityAffinity() {
        return primaryFacilityAffinity;
    }

    public void setPrimaryFacilityAffinity(String primaryFacilityAffinity) {
        this.primaryFacilityAffinity = primaryFacilityAffinity;
    }

    public List<String> getPrescriptiveRecommendations() {
        return prescriptiveRecommendations;
    }

    public void setPrescriptiveRecommendations(List<String> prescriptiveRecommendations) {
        this.prescriptiveRecommendations = prescriptiveRecommendations;
    }
}
