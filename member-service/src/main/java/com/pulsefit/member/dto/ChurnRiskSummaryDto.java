package com.pulsefit.member.dto;

import java.util.List;

public class ChurnRiskSummaryDto {

    private int totalMembersAnalyzed;
    private int lowRiskCount;
    private int moderateRiskCount;
    private int criticalRiskCount;
    private double overallRetentionRate;
    private List<MemberRetentionInsightDto> flaggedMembers;

    public ChurnRiskSummaryDto() {}

    public ChurnRiskSummaryDto(int totalMembersAnalyzed, int lowRiskCount, int moderateRiskCount,
                               int criticalRiskCount, double overallRetentionRate,
                               List<MemberRetentionInsightDto> flaggedMembers) {
        this.totalMembersAnalyzed = totalMembersAnalyzed;
        this.lowRiskCount = lowRiskCount;
        this.moderateRiskCount = moderateRiskCount;
        this.criticalRiskCount = criticalRiskCount;
        this.overallRetentionRate = overallRetentionRate;
        this.flaggedMembers = flaggedMembers;
    }

    public int getTotalMembersAnalyzed() {
        return totalMembersAnalyzed;
    }

    public void setTotalMembersAnalyzed(int totalMembersAnalyzed) {
        this.totalMembersAnalyzed = totalMembersAnalyzed;
    }

    public int getLowRiskCount() {
        return lowRiskCount;
    }

    public void setLowRiskCount(int lowRiskCount) {
        this.lowRiskCount = lowRiskCount;
    }

    public int getModerateRiskCount() {
        return moderateRiskCount;
    }

    public void setModerateRiskCount(int moderateRiskCount) {
        this.moderateRiskCount = moderateRiskCount;
    }

    public int getCriticalRiskCount() {
        return criticalRiskCount;
    }

    public void setCriticalRiskCount(int criticalRiskCount) {
        this.criticalRiskCount = criticalRiskCount;
    }

    public double getOverallRetentionRate() {
        return overallRetentionRate;
    }

    public void setOverallRetentionRate(double overallRetentionRate) {
        this.overallRetentionRate = overallRetentionRate;
    }

    public List<MemberRetentionInsightDto> getFlaggedMembers() {
        return flaggedMembers;
    }

    public void setFlaggedMembers(List<MemberRetentionInsightDto> flaggedMembers) {
        this.flaggedMembers = flaggedMembers;
    }
}
