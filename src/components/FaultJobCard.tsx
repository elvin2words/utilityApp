// components/common/FaultCard.tsx

import React, { useRef, useState } from "react";
import { Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { MapPin, Users, Clock, AlertTriangle } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { Fault, computeSLAState, SLAInfo} from "@/src/types/faults";

import { formatDateTime, getStatusColor, getPriorityColor } from "@/src/lib/utils";

import { Button } from "@/src/components/ui/Button";
import { SLABadge } from "@/src/components/ui/uiAccessories";

import { AppTheme } from "@/src/lib/colors";
import { useThemeStore } from "@/src/lib/themeStore";



/* ------------------ Subcomponents ------------------ */
const Badge = ({ text, color }: { text: string; color: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const getSeverityColor = (sev: Fault["severity"]) => (
  { critical: "#DC2626", major: "#F97316", moderate: "#FACC15", minor: "#10B981" }[sev]
);

const getStatusColor2 = (status: Fault["status"]) => (
  {
    active: "#2563EB",
    pending: "#FACC15",
    in_progress: "#F59E0B",
    resolved: "#10B981",
    closed: "#6B7280",
    cancelled: "#9CA3AF",
    on_hold: "#FBBF24",
    escalated: "#DC2626",
  }
  [status]
);

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();


/* ------------------ Types ------------------ */
type FaultCardProps = {
  fault: Fault;
  // slaState: SLAInfo;
  themeColors: AppTheme;
  type: "active" | "pending" | "resolved" | "task" | "supervisor";
  // onPress?: () => void;
  onMarkResolved?: (id: string) => void;
  onExtended?: (id: string) => void;
  onAssign?: (fault: Fault) => void;
  onStatusChange?: (id: string, nextStatus: string) => void;
  onToggleSelect?: (id: string) => void;
  onExpandedJob?:(id:string) => void;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
  isSelected?: boolean;
  actionButtons?: ActionButton[];
  // extraActions?: React.ReactNode; // supervisor-specific or screen-provided actions
};

type ActionButton = {
  label: string;
  action: () => void;
  primary?: boolean; 
  color?: string;
};



/* ------------------ Main Component ------------------ */
export function FaultCard({
  fault,
  type,
  themeColors,
  onMarkResolved,
  onExtended,
  onAssign,
  onExpandedJob,
  onStatusChange,
  onToggleSelect,
  expanded = false,
  onToggleExpand,
  isSelected = false,  
  actionButtons,
}: FaultCardProps) {
  // const [expanded, setExpanded] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const animatedHeight = useRef(new Animated.Value(1)).current;

  const sla = computeSLAState(fault);
  const priorityText = capitalize(fault.priority || "Medium");

  const showCompact = type === "task";
  const showMedium = type === "pending" || type === "task";
  const showFull = type === "active";


  /* ------------------ Swipe Actions ------------------ */
  const leftActions = () => 
    type === "active" ? (
    <RectButton style={styles.swipeRight} onPress={() => onMarkResolved?.(fault.id)}>
      <Text style={styles.swipeText}>✔ Mark Resolved</Text>
    </RectButton>
    ):null;

  
  const rightActions = () => 
    type === "active" ? (
    <RectButton style={styles.swipeLeft} onPress={() => onExtended?.(fault.id)}>
      <Text style={styles.swipeText}>⚠ Extended Fix</Text>
    </RectButton>
    ):null;


  const getCardStyle = () => {
    switch (type) {
      case "active":
        return [styles.card, styles.activeCard];
      case "pending":
        return [styles.card, styles.mediumCard];
      case "resolved":
        return [styles.card, styles.compactCard];
      case "supervisor":
        return [styles.supCard, styles.supervisorCard];        
      default:
        return [styles.card, styles.taskCard];
    }
  };

  
  /* ------------------ Render Variants ------------------ */
  const renderActiveCard = () => (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <Badge text={fault.severity.toUpperCase()} color={getSeverityColor(fault.severity)} />
        {fault.priority && (
          <Badge text={"Priority Level: " + fault.priority} color={fault.priorityColor ?? "#6B7280"} />
        )}
        <Badge text={fault.status.toUpperCase()} color={getStatusColor2(fault.status)} />
      </View>

      {/* Title + Ref */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{fault.title}</Text>
        <Text style={styles.refNumber}>#{fault.referenceNumber}</Text>
      </View>

      {/* Description */}
      {fault.description && (
        <Text style={styles.description}>{fault.description}</Text>
      )}
      
      {/* Location + Asset */}
      <View style={styles.metaRow}>
        <TouchableOpacity onPress={() => {
          // navigate to map screen with fault.id
          // replace with  nav hook
          Toast.show({ type: "info", text1: `Opening ${fault.locationName} on map...` });
          // navigation.navigate("Map", { faultId: task.id });

        }}>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.locationText}>{fault.locationName}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.assetText}>
          <TouchableOpacity onPress={() => {
            // replace with  nav hook
            Toast.show({ type: "info", text1: `Opening ${fault.assetType} ${fault.assetId} details...` });
          }}>
            <Text style={styles.locationText}>Asset: {fault.assetType || "N/A"}</Text> 
          </TouchableOpacity>
        </Text>
      </View>
      
      {/* SLA + Extra */}
      <View style={styles.metaRow}>
        <View style={styles.slaRow}>
          <Clock size={14} color="#DC2626" />
          <Text style={[styles.slaText, sla.state === "breached" && styles.slaBreached]}>
            SLA: {sla.minutesLeft > 0 ? `${sla.minutesLeft} min left` : "Breached"}
          </Text>
        </View>

        <Text style={styles.extraText}>Impact: {priorityText}</Text>
      </View>
    </View>
  );

  const renderPendingCard = () => (
    <View>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{fault.title}</Text>
        <View style={[styles.priorityDot, { backgroundColor: fault.priorityColor }]} />
      </View>
      <Text style={styles.ref}>#{fault.referenceNumber}</Text>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <TouchableOpacity onPress={() => { 
            // navigate to map screen with fault.id
            // replace with  nav hook
            Toast.show({ type: "info", text1: `Opening ${fault.locationName} on map...` });
          }}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#555" />
              <Text style={styles.locationText}>{fault.locationName}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.status}>{fault.status.toUpperCase()}</Text>
      </View>      

      {expanded && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.description}>{fault.description}</Text>
        </View>
      )}
    </View>
  );

  const renderDefaultCard = () => (
    <View>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{fault.title}</Text>
        <View style={[styles.priorityDot, { backgroundColor: fault.priorityColor }]} />
      </View>
      <Text style={styles.ref}>#{fault.referenceNumber}</Text>
      <Text style={styles.description}>{fault.description}</Text>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <TouchableOpacity onPress={() => {
            // navigate to map screen with fault.id
            // replace with  nav hook
            Toast.show({ type: "info", text1: `Opening ${fault.locationName} on map...` });
            // navigation.navigate("Map", { faultId: task.id });
          }}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#555" />
              <Text style={styles.locationText}>{fault.locationName}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.status}>{fault.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderSupervisorCard = () => (
    <Pressable 
      style={[ 
        { backgroundColor: themeColors.colors.taskCard },
         isSelected && 
          //  styles.supCardSelected
          {
            borderWidth: 1,
            borderColor: themeColors.colors.primary,
          },
        ]}
      // onPress={() => setExpanded(!expanded)}
      // onPress = {() => setExpandedJob((prev) => (prev === fault.id ? null : fault.id))}
      // onPress = {() => onExpandedJob?.(fault.id)}
      onPress = {() => onToggleExpand?.(fault.id)}
      onLongPress={() => onToggleSelect?.(fault.id)}
      accessibilityLabel={`View details for fault ${fault.title}`}
      accessibilityHint="Tap to expand and view more details"
    >
      <View style={styles.supCardHeader}>
        <Text 
          style={[
            styles.supCardTitle,
            { color: themeColors.colors.maintext },
          ]}
        >
          {/* {fault.referenceNumber ?? fault.id} ·  */}
          {fault.title}
        </Text>
        <SLABadge state={sla.state?? "ok"} minutesLeft={sla.minutesLeft??0} />
      </View>

      <View style={styles.dataCols}>
        <Text style={styles.dataColDescr}>{fault.description}</Text>
        <View style={styles.colSection}>
          <Text style={styles.colSecData}>{fault.priority + " Priority"}</Text>
          <Text style={styles.colSecData}>{fault.status}</Text>
        </View>
      </View>
      
      <View style={styles.metaRow}>
        <View style={styles.locationRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.locationText}>{fault.locationName}</Text>
        </View>
        {fault.isTeamJob && (
          <Text style={styles.colSecData}>
            {/* <View style={styles.teamRow}> */}
              {/* <Users size={16} color="#020202ff" /> */}
              {fault.teamName + " Assigned"}
            {/* </View> */}
          </Text>
        )}
        {!fault.isTeamJob && (
          <View style={styles.teamRow}>
            <Users size={16} color="#7C3AED" />
            <Text style={styles.colSecData}>{fault.assignedTo?.name + " Assigned"}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.metaRow}>
        <View style={styles.locationRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.locationText}>{fault.isTeamJob}</Text>
        </View>
        <View style={styles.teamRow}>
          <Users size={16} color="#7C3AED" />
          <Text style={styles.colSecData}>{fault.assignedTo?.name + " Assigned"}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        {fault.team && fault.team.length > 0 && (
          <View style={styles.teamRow}>
            <Users size={16} color="#7C3AED" />
            <Text style={styles.teamText}>{fault.team.length} team members</Text>
          </View>
        )}

        {!!fault.impact?.customersAffected && (
          <View style={styles.impactRow}>
            <AlertTriangle size={16} color="#F59E0B" />
            <Text style={styles.impactText}>
              {fault.impact.customersAffected}+ customers affected
            </Text>
          </View>
        )}
      </View>

      {/* {expandedJob === fault.id && !!fault.description && ( */}
      {expanded && !!fault.description && (
        <Text style={styles.description}>{fault.description}</Text>
      )}

      {/* Supervisor Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => onAssign?.(fault)}
        >
          <Text style={styles.actionBtnText}>
            {fault.assignedTo ? "Reassign" : "Assign"}
          </Text>
        </Pressable>

        {fault.coords && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              const { latitude, longitude } = fault.coords!;
              const url = Platform.select({
                ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
                android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
                default: `https://maps.google.com/?q=${latitude},${longitude}`,
              });
              Linking.openURL(url!);
            }}
          >
            <Text style={styles.actionBtnText}>Map</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.actionBtn, styles.selectBtn]}
          onPress={() => onToggleSelect?.(fault.id)}
        >
          <Text style={styles.actionBtnText}>
            {isSelected ? "Deselect" : "Select"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() =>
            onStatusChange?.(
              fault.id,
              fault.status === "in_progress" ? "resolved" : "in_progress"
            )
          }
        >
          <Text style={styles.actionBtnText}>
            {fault.status === "in_progress" ? "Verified" : "Start"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

  

  return (
    <View >
      <Swipeable
        renderLeftActions={leftActions}
        renderRightActions={rightActions}
      >
        <TouchableOpacity
          style={getCardStyle()}      
          activeOpacity={0.9}
          // onPress={() => setShowDetailsModal(true)}  
          onPress={() => {
            if (type === "active" ){
              // setShowDetailsModal(true); // Open modal on tap
              Toast.show({
                type: "info",
                text1: "Swipe for Actions",
                text2: "⬅ Swipe left to extend fix, ➡ swipe right to close job.",
              });
            // } else if (type === "pending") {
            //   setExpandedJob(!expanded);
            // } else if (type === "supervisor") {
            //   // setExpandedJob(expandedJob);  
            //   setExpandedJob((prev) => (prev === fault.id ? null : fault.id))            
            } else if (type === "pending" || type === "supervisor") {
              // Let parent control expansion
              onToggleExpand?.(fault.id);
            } else {
              setShowDetailsModal(true);
            }
          }} 
          onLongPress={() => {
            if (type === "supervisor") {
              onToggleSelect?.(fault.id)
            }
          }}
          accessibilityLabel={`View details for fault ${fault.title}`}
          accessibilityHint="Tap to expand and view more details"
        >
          
          {type === "active"
            ? renderActiveCard()
            : type === "supervisor"
            ? renderSupervisorCard()
            : type === "pending"
            ? renderPendingCard()
            : renderDefaultCard()
          }


          {/* Buttons */}
          {(type === "active" || expanded) && (
            <View style={styles.actions}>
              {type === "active" && (
                <Button onPress={() => setShowDetailsModal(true)} style={styles.fullButton}>
                  More Details
                </Button>
              )}
              {actionButtons && actionButtons.length > 0 && (
              actionButtons.length === 1 ? (
                <Button
                  onPress={actionButtons[0].action}
                  variant={actionButtons[0].primary ? "default" : "outline"}
                  style={styles.fullButton}
                >
                  {actionButtons[0].label}
                </Button>
              ) : (
                <View style={styles.buttonRow}>
                  {actionButtons.map((btn, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.buttonCell,
                        index < actionButtons.length - 1 && styles.divider,
                      ]}
                      android_ripple={{ color: "#E5E7EB" }}
                      onPress={btn.action}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: btn.color ?? (btn.primary ? "#2563EB" : "#4B5563"),
                          },
                        ]}
                      >
                        {btn.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                )
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>

      {/* Modal for Detailed View */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDetailsModal(false)}>
            <Pressable style={styles.modalContent}
              onPress={() => {}} // prevents closing when clicking inside
            >
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Text style={styles.modalTitle}>{fault.title}</Text>
                <Text style={styles.modalText}>Reference #: {fault.referenceNumber}</Text>
                <Text style={styles.modalText}>Status: {capitalize(fault.status)}</Text>
                <Text style={styles.modalText}>
                  Location: {fault.locationName} 
                  {/* (GPS: {fault.coords.latitude}, {fault.coords.longitude}) */}
                </Text>
                {fault.description && <Text style={styles.modalText}>{fault.description}</Text>}
                <Text style={styles.modalText}>
                  Reported: {formatDateTime(fault.timeline.reported)}
                </Text>
              <Text style={styles.modalMeta}>Severity: {fault.severity}</Text>
              <Text style={styles.modalMeta}>Utility: {fault.utilityType}</Text>
              <Text style={styles.modalMeta}>Zone: {fault.zone}</Text>

              {/* Timeline */}
              <View style={styles.timelineBlock}>
                <Text style={styles.timelineTitle}>Timeline</Text>
                {fault.timeline.logs?.map((log, idx) => (
                  <Text key={idx} style={styles.timelineText}>
                    {formatDateTime(log.timestamp)} — {log.event} ({log.note})
                  </Text>
                ))}
              </View>              
                {/* Add more fault-specific fields if needed */}
              </ScrollView>
              {type === "active" && (
                <View style={styles.modalActions}>
                  <Button onPress={() => onMarkResolved?.(fault.id)}>✔ Mark Resolved</Button>
                  <Button onPress={() => onExtended?.(fault.id)} variant="secondary">⚠ Extend Fix</Button>
                </View>
              )}

              <Button onPress={() => setShowDetailsModal(false)}>Close</Button>
            </Pressable>
          </Pressable>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  activeCard: { borderLeftWidth: 4, borderLeftColor: "#2563EB", },
  mediumCard: { backgroundColor: "#F3F4F6", },
  compactCard: { backgroundColor: "#F9FAFB", },
  taskCard: { backgroundColor: "#F9FAFB" },
  supervisorCard: { borderLeftWidth: 4, borderLeftColor: "#7C3AED", backgroundColor: "#F5F3FF" },

  activeHighlight: { borderLeftWidth: 4, borderLeftColor: "#2563EB", },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  subtitle: { fontSize: 13, color: "#6B7280", marginBottom: 6 },

  slaRow: { flexDirection: "row", alignItems: "center",},
  slaText: { fontSize: 13, marginLeft: 4, color: "#DC2626" },
  slaBreached: { fontWeight: "bold", color: "#B91C1C" },

  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  locationText: { marginLeft: 4, fontSize: 13, color: "#4B5563", textDecorationLine: "underline", },

  teamRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  teamText: { marginLeft: 4, fontSize: 13, color: "#2563EB" },

  impactRow: { flexDirection: "row", alignItems: "center" },
  impactText: { marginLeft: 4, fontSize: 13, color: "#F59E0B" },

  actions: { marginTop: 16, },
  
  swipeRight: {
    backgroundColor: "#10B981",
    justifyContent: "center",
    borderRadius:20,
    alignItems: "flex-end",
    padding: 20,
  },
  swipeLeft: {
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    borderRadius:20,
    padding: 20,
  },
  swipeText: { color: "#fff", fontWeight: "bold", },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
    // pointerEvents:"box-none"
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  modalText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 6,
  },

  timelineBlock: { marginTop: 12 },
  timelineTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  timelineText: { fontSize: 13, color: "#4B5563", marginBottom: 2 },

  modalActions: { marginBottom: 12, gap: 8 }, 
  
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ref: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
    color: "#007AFF",
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },


  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  refNumber: {
    fontSize: 12,
    color: "#6B7280",
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
    marginTop:12,
  },
  locationLink: {
    fontSize: 13,
    color: "#6b7280d5",
    fontWeight: "600",
  },
  assetText: {
    fontSize: 13,
    color: "#4B5563",
  },
  extraText: {
    fontSize: 13,
    color: "#374151",
  },

  supCard: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: "#0b1220",
      borderWidth: 1,
      borderColor: "#1f2533",
      marginBottom: 12,
    },
  supCardSelected: { 
    borderColor: "#60a5fa", 
    backgroundColor: "#081028" },
  supCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  supCardTitle: { color: "#455677ff", fontWeight: "600", fontSize:14, },
  supCardSubtitle: { color: "#9ca3af", marginBottom: 4 },
  supCardMeta: { color: "#94a3b8", fontSize: 12 },

  dataCols:{flexDirection:"row", justifyContent:"space-evenly"},
  dataColDescr:{width:220, fontSize:12,},
  colSection:{flexDirection:"column", fontSize:12, },
  colSecData:{fontSize:13, },

  actionsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent:"space-evenly", marginTop: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1f2937", marginRight: 8, marginTop: 6 },
  selectBtn: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2533" },
  actionBtnText: { color: "#e5e7eb", fontSize: 12 },

  fullButton: {
      width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  buttonCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  
  modalMeta: { fontSize: 13, color: "#6B7280", marginBottom: 4 },

  // description: { fontSize: 14, color: "#e5e7eb", marginTop: 8 },


});
